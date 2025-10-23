// =================================================================
// 步驟一：模擬成績數據接收
// -----------------------------------------------------------------


// let scoreText = "成績分數: " + finalScore + "/" + maxScore;
// 確保這是全域變數
let finalScore = 0; 
let maxScore = 0;
let scoreText = ""; // 用於 p5.js 繪圖的文字
let fireworks = []; // 【保留】用於儲存所有啟動的煙火物件


window.addEventListener('message', function (event) {
    // 執行來源驗證...
    // ...
    const data = event.data;
    
    if (data && data.type === 'H5P_SCORE_RESULT') {
        
        // !!! 關鍵步驟：更新全域變數 !!!
        finalScore = data.score; // 更新全域變數
        maxScore = data.maxScore;
        scoreText = `最終成績分數: ${finalScore}/${maxScore}`;
        
        console.log("新的分數已接收:", scoreText); 

        // ----------------------------------------
        // 關鍵步驟 2: 呼叫重新繪製 
        // ----------------------------------------
        if (typeof redraw === 'function') {
            redraw(); 
        }
    }
}, false);


// =================================================================
// 步驟二：使用 p5.js 繪製分數 (在網頁 Canvas 上顯示)
// -----------------------------------------------------------------

function setup() { 
    createCanvas(windowWidth / 2, windowHeight / 2); 
    // 【保留】移除 noLoop() 確保動畫執行
    frameRate(60); // 確保流暢的動畫
    colorMode(HSB); // 使用 HSB 顏色模式方便隨機顏色
} 

function draw() { 
    // 【重要修正】使用完全不透明的黑色背景 (0)，確保文字和分數清晰可見，避免殘影。
    background(0); 

    // 計算百分比
    let percentage = maxScore > 0 ? (finalScore / maxScore) * 100 : 0;

    textSize(80); 
    textAlign(CENTER);
    
    // -----------------------------------------------------------------
    // A. 根據分數區間改變文本顏色和內容 (畫面反映一)
    // -----------------------------------------------------------------
    if (percentage >= 90) {
        // 滿分或高分：顯示鼓勵文本，使用鮮豔顏色 (HSB 綠色)
        fill(100, 255, 255); 
        text("恭喜！優異成績！", width / 2, height / 2 - 50);
        
    } else if (percentage >= 60) {
        // 中等分數：顯示一般文本 (HSB 黃色)
        fill(45, 255, 255); 
        text("成績良好，請再接再厲。", width / 2, height / 2 - 50);
        
    } else if (percentage > 0) {
        // 低分：顯示警示文本 (HSB 紅色)
        fill(0, 255, 255); 
        text("需要加強努力！", width / 2, height / 2 - 50);
        
    } else {
        // 尚未收到分數或分數為 0
        fill(255); // 白色
        text("等待分數...", width / 2, height / 2);
    }

    // 顯示具體分數
    textSize(50);
    fill(255); // 白色
    text(`得分: ${finalScore}/${maxScore}`, width / 2, height / 2 + 50);
    
    
    // -----------------------------------------------------------------
    // B. 根據分數觸發不同的幾何圖形反映 & 煙火特效 (畫面反映二)
    // -----------------------------------------------------------------
    
    if (percentage >= 90) {
        // 【煙火觸發點】每隔一段時間隨機產生一個新的煙火物件
        if (random(1) < 0.05) { // 調整這個值來控制煙火發射頻率
            fireworks.push(new Firework()); 
        }

        // 畫一個大圓圈代表完美 
        fill(100, 255, 255, 0.5); // 帶透明度
        noStroke();
        circle(width / 2, height / 2 + 150, 150);

    } else {
        // 【新增】非高分時，清空煙火陣列以停止特效
        fireworks = [];
    }
    
    // -----------------------------------------------------------------
    // C. 更新並顯示煙火 (Draw Fireworks)
    // -----------------------------------------------------------------
    for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        fireworks[i].display();
        
        // 移除已經完成（已爆炸且粒子已消失）的煙火
        if (fireworks[i].isFinished()) {
            fireworks.splice(i, 1);
        }
    }
}


// =================================================================
// 步驟三：定義 Firework 和 Particle 類別 (實現煙火動畫)
// -----------------------------------------------------------------

// ----------------------
// Particle 粒子類別
// ----------------------
class Particle {
    constructor(x, y, hue, fireworkMode = false) {
        this.pos = createVector(x, y);
        this.lifespan = 255;
        this.hu = hue;
        this.fireworkMode = fireworkMode; // true: 爆炸後粒子, false: 火箭主體

        if (this.fireworkMode) {
            // 爆炸粒子：隨機速度，加上一個向上的推力
            this.vel = p5.Vector.random2D();
            this.vel.mult(random(1, 10));
            this.acc = createVector(0, 0);
        } else {
            // 火箭主體：初始速度向上
            this.vel = createVector(0, random(-10, -15));
            this.acc = createVector(0, 0);
        }
    }

    applyForce(force) {
        this.acc.add(force);
    }

    update() {
        if (!this.fireworkMode) {
            // 火箭主體在到達頂點後速度應減小
            this.vel.mult(0.99); 
            // 粒子本身會逐漸消失
            this.lifespan -= 4; 
        } else {
            // 爆炸粒子：逐漸消失
            this.vel.mult(0.9); // 爆炸後的粒子減速更快
            this.lifespan -= 5;
        }

        this.vel.add(this.acc);
        this.pos.add(this.vel);
        this.acc.mult(0); // 重置加速度
    }

    display() {
        strokeWeight(2);
        // 顏色使用 HSB 模式，並使用 this.lifespan 來控制 Alpha (透明度)
        stroke(this.hu, 255, 255, this.lifespan); 
        point(this.pos.x, this.pos.y);
    }

    // 檢查粒子是否已經完全消失
    isFinished() {
        return this.lifespan < 0;
    }
}

// ----------------------
// Firework 煙火類別
// ----------------------
class Firework {
    constructor() {
        this.hu = random(255); // 隨機顏色
        this.firework = new Particle(random(width), height, this.hu); // 從底部發射
        this.exploded = false;
        this.particles = []; // 爆炸後的粒子陣列
        this.gravity = createVector(0, 0.2); // 重力
    }

    update() {
        if (!this.exploded) {
            this.firework.applyForce(this.gravity);
            this.firework.update();
            
            // 檢查是否到達頂點 (y 速度轉為正)
            if (this.firework.vel.y >= 0) {
                this.explode();
                this.exploded = true;
            }
        } else {
            // 更新所有爆炸後的粒子
            for (let i = this.particles.length - 1; i >= 0; i--) {
                this.particles[i].applyForce(this.gravity);
                this.particles[i].update();
                // 為了簡單，我們在這裡不進行粒子移除，而是交給 firework 的 isFinished 檢查
            }
        }
    }

    // 產生爆炸粒子
    explode() {
        let particleCount = random(50, 100);
        for (let i = 0; i < particleCount; i++) {
            // 傳遞 true 表示這是爆炸粒子
            let p = new Particle(this.firework.pos.x, this.firework.pos.y, this.hu, true); 
            this.particles.push(p);
        }
    }

    display() {
        if (!this.exploded) {
            this.firework.display();
        } else {
            for (let i = 0; i < this.particles.length; i++) {
                this.particles[i].display();
            }
        }
    }
    
    // 檢查煙火是否已經完成 (火箭已爆炸，且所有粒子都已消失)
    isFinished() {
        return this.exploded && this.particles.every(p => p.isFinished());
    }
}

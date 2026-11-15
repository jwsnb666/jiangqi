const SFX=(function(){
let ctx=null,master=null,muted=false,volume=0.8,currentAudio=null,currentNodes=[];
const DEFS={
move:{src:'move.mp3',tones:[{f:540,d:.045,type:'triangle',v:.2},{f:340,d:.07,type:'triangle',v:.14,t:.035}]},
capture:{src:'capture.mp3',tones:[{f:260,d:.05,type:'square',v:.16},{f:170,d:.11,type:'square',v:.12,t:.04}]},
check:{src:'check.mp3',tones:[{f:880,d:.09,type:'sawtooth',v:.1},{f:1175,d:.11,type:'sawtooth',v:.1,t:.09}]},
win:{src:'win.mp3',tones:[{f:523,d:.09,type:'triangle',v:.18},{f:659,d:.09,type:'triangle',v:.18,t:.09},{f:784,d:.09,type:'triangle',v:.18,t:.18},{f:1047,d:.2,type:'triangle',v:.2,t:.27}]},
select:{tones:[{f:880,d:.05,type:'sine',v:.1}]},
illegal:{tones:[{f:150,d:.07,type:'square',v:.12},{f:110,d:.1,type:'square',v:.1,t:.06}]},
promote:{tones:[{f:523,d:.07,type:'triangle',v:.16},{f:659,d:.07,type:'triangle',v:.16,t:.075},{f:784,d:.12,type:'triangle',v:.18,t:.15}]},
gameStart:{tones:[{f:392,d:.08,type:'triangle',v:.18},{f:523,d:.08,type:'triangle',v:.18,t:.08},{f:659,d:.12,type:'triangle',v:.2,t:.16}]},
lose:{tones:[{f:523,d:.12,type:'triangle',v:.16},{f:415,d:.12,type:'triangle',v:.16,t:.12},{f:330,d:.12,type:'triangle',v:.16,t:.24},{f:262,d:.26,type:'triangle',v:.18,t:.36}]}
};
function init(){if(ctx){if(ctx.state==='suspended')ctx.resume();return}const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ctx=new AC();master=ctx.createGain();master.gain.value=volume;master.connect(ctx.destination)}
function stopAll(){if(currentAudio){currentAudio.pause();currentAudio.currentTime=0;currentAudio=null}currentNodes.forEach(o=>{try{o.stop()}catch(e){}});currentNodes=[]}
function playTones(tones){if(!tones||!tones.length)return;if(!ctx)init();if(!ctx)return;if(ctx.state==='suspended')ctx.resume();const now=ctx.currentTime;for(const t of tones){const start=now+(t.t||0),end=start+t.d;const osc=ctx.createOscillator(),g=ctx.createGain();osc.type=t.type||'sine';osc.frequency.setValueAtTime(t.f,start);g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(t.v,start+.006);g.gain.exponentialRampToValueAtTime(.0001,end);osc.connect(g);g.connect(master);osc.start(start);osc.stop(end+.02);currentNodes.push(osc)}}
function play(name){if(muted)return;const def=DEFS[name];if(!def)return;stopAll();if(def.src){const a=new Audio(def.src);currentAudio=a;a.volume=volume;a.play().catch(()=>{if(currentAudio===a)currentAudio=null;playTones(def.tones)});return}playTones(def.tones)}

function playMoveAnim(info) {
    if (!info || !info.move || info.move.drop) return;
    const mv = info.move;
    if (!mv.from || !mv.to) return;
    const canvas = document.getElementById('board');
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    
    // 计算格子大小和边距 (按原版代码 9x9, 边距 22px, 格子 56px 推算比例)
    const boardSize = 9 * 56 + 22 * 2;
    const scale = w / boardSize;
    const cell = 56 * scale;
    const margin = 22 * scale;
    
    let r1 = mv.from[0], c1 = mv.from[1], r2 = mv.to[0], c2 = mv.to[1];
    if (info.isViewFlipped) { r1 = 8 - r1; c1 = 8 - c1; r2 = 8 - r2; c2 = 8 - c2; }
    
    const x1 = margin + c1 * cell + cell / 2;
    const y1 = margin + r1 * cell + cell / 2;
    const x2 = margin + c2 * cell + cell / 2;
    const y2 = margin + r2 * cell + cell / 2;
    
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.left = (x1 - cell/2) + 'px';
    div.style.top = (y1 - cell/2) + 'px';
    div.style.width = cell + 'px';
    div.style.height = cell + 'px';
    div.style.zIndex = '999';
    div.style.pointerEvents = 'none';
    div.style.transition = 'transform 0.2s ease-out';
    
    // 提取该格子原有棋子样式 (大致模拟)
    const bgGrad = 'linear-gradient(#f7e5bd, #dcb878)';
    div.innerHTML = `<div style="width:100%;height:100%;background:${bgGrad};border-radius:4px;box-shadow:0 2px 6px rgba(0,0,0,0.4);border:2px solid #5a3a14;box-sizing:border-box;"></div>`;
    
    canvas.parentElement.appendChild(div);
    
    // 强制回流后启动动画
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            div.style.transform = `translate(${x2 - x1}px, ${y2 - y1}px)`;
        });
    });
    
    setTimeout(() => { div.remove(); }, 220);
}

function classify(info){if(!info)return null;if(info.checkmate)return 'win';if(info.check)return 'check';if(info.capture)return 'capture';if(info.promoted)return 'promote';if(info.kind==='drop'||info.kind==='move')return 'move';if(info.kind==='select')return 'select';if(info.kind==='illegal')return 'illegal';if(info.kind==='restart')return 'gameStart';if(info.kind==='win')return 'win';if(info.kind==='lose')return 'lose';return null}

return{
    init,play,classify,DEFS,playMoveAnim,
    setMuted(m){muted=!!m},isMuted(){return muted},
    setVolume(v){volume=Math.max(0,Math.min(1,v));if(master)master.gain.value=volume},
    getVolume(){return volume}
}
})();
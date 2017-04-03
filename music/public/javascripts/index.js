function $(s){
	return document.querySelectorAll(s);
}

var lis = $("#list li");

for(var i=0;i<lis.length;i++){
	lis[i].onclick=function(){
		for(var j=0;j<lis.length;j++){
			lis[j].className="";
		}
		this.className="selected";
		load("/media/"+this.title);
	};
}

var xhr = new XMLHttpRequest();
var ac = new (window.AudioContext||window.webkitAudioContext)();
var gainNode = ac[ac.createGain?"createGain":"createGainNode"]();
gainNode.connect(ac.destination);

var analyser = ac.createAnalyser();
var size = 128;
analyser.fftSize = size * 2;
analyser.connect(gainNode);

var source = null;

var count = 0;

var box = $("#box")[0];
var height,width;
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
box.appendChild(canvas);

function resize(){
	height = box.clientHeight;
	width = box.clientWidth;
	canvas.height = height;
	canvas.width = width;
	var line = ctx.createLinearGradient(0,0,0,height);
	line.addColorStop(0,"red");
	line.addColorStop(0.5,"yellow");
	line.addColorStop(1,"green");
	ctx.fillStyle = line;
}
resize();

window.onresize = resize;

function draw(arr){
	ctx.clearRect(0,0,width,height);
	var w = width / size;
	for(var i = 0;i < size; i++){
		var h = arr[i]/256*height;
		ctx.fillRect(w*i,height-h,w*0.6,h);
	}
}

function load(url){
	var n = ++count;
	source && source[source.stop?"stop":"noteOff"]();
	xhr.abort();
	xhr.open("GET",url);
	xhr.responseType="arraybuffer";
	xhr.onload=function(){
		if(n != count)return;
		ac.decodeAudioData(xhr.response,function(buffer){
			if(n != count)return;
			var bufferSource = ac.createBufferSource();
			bufferSource.buffer = buffer;
			bufferSource.connect(analyser);
			bufferSource[bufferSource.start?"start":"noteOn"](0);
			source = bufferSource;
		},function(err){
			concole.log(err);});
	};
	xhr.send();
}

function visualizer(){
	var arr = new Uint8Array(analyser.frequencyBinCount);
	requestAnimationFrame = window.requestAnimationFrame ||
							window.webkitRequestAnimationFrame ||
							window.mozRequestAnimationFrame;
	function v(){
		analyser.getByteFrequencyData(arr);
		//console.log(arr);
		draw(arr);
		requestAnimationFrame(v);
	}
	requestAnimationFrame(v);
	analyser.getByteFrequencyData(arr);
	console.log(arr);
}
visualizer();

function changeVolume(percent){
	gainNode.gain.value = percent *percent; 
}

$("#volume")[0].onchange = function(){
	changeVolume(this.value/this.max);
};
$("#volume")[0].onchange();
const divAreaTabuleiro = document.getElementById("areaTabuleiro");
const divAreaBolas = document.getElementById("areaBolas");
const sfxBola = document.getElementById("sfxBola");
const sfxMover = document.getElementById("sfxMover");
const sfxPeca = document.getElementById("sfxPeca");
const sfxTabuleiro = document.getElementById("sfxTabuleiro");

var tabuleiro = null;
var pecaSelecionada = null;
var filas = [];

//Origem XY do mouse, para movimentação de peças
var origX = 0;
var origY = 0;

//#region Classes

class Tabuleiro {
	constructor(_x,_y) {
		tabuleiro = this;
		this.x = 0;
		this.y = 0;
		this.numOrigens = 1;
		this.el = document.createElement("div");
		this.el.classList.add("tabuleiro");
		divAreaTabuleiro.appendChild(this.el);

		this.celulas = [];
		this.origens = [];
		this.gerarCelulas(_x,_y);
		this.pecas = [];
		this.gerarPecas(10,8);
		this.reposicionarPecas();
	}
	gerarCelulas(_x,_y) {
		this.x = _x;
		this.y = _y;
		this.el.style.gridTemplateColumns = `repeat(${this.x}, 50px)`;
		this.el.style.gridTemplateRows = `repeat(${this.y}, 50px)`;
		this.celulas = Array.from({length: this.x},(_v,_iX)=>Array.from({length: this.y},(_v,_iY)=>new Celula(this,_iX,_iY)));
		this.computarVizinhos();
		this.computarOrigens(this.numOrigens);
	}
	gerarPecas(_numPecas = 5, _maxSlots = 5) {
		for (let i = 0; i < _numPecas; i++) {
			let origem = this.origens[Math.floor(Math.random()*this.numOrigens)];
			let numSlots = Math.ceil(Math.random()*_maxSlots);
			if (numSlots <= 1) {
				numSlots = 2;
			}
			let novaPeca = this.gerarPeca(origem.x,origem.y,numSlots);
			if (novaPeca.slots.length == 0) {
				this.pecas.pop();
				i--;
				continue;
			}
			filas[0].tam+=novaPeca.slots.length;
			criarBolasAleatorias(novaPeca.slots.length,4);
			novaPeca.procurarEncaixe();
		}
		//this.gerarPeca(0,0,4);
		//this.gerarPeca(this.x-1,0,4);
		//this.gerarPeca(0,this.y-1,4);
		//this.gerarPeca(this.x-1,this.y-1,4);
		//console.log("Peças geradas!");
	}
	gerarPeca(_x,_y,_slots=2) {
		let novaPeca = new Peca(this,_x,_y,_slots);
		return novaPeca;
	}
	reposicionarPecas() {
		this.pecas.forEach(_peca => {
			_peca.reposicionarSlots();
		});
	}
	computarVizinhos() {
		for (var posX = 0; posX < this.x; posX++) {
			for (var posY = 0; posY < this.y; posY++) {
				this.celulas[posX][posY].computarVizinhos();
			}
		}
		//console.log("Vizinhos computados!");
	}
	obterCelula(_x,_y) {
		_x = Math.floor(_x);
		_y = Math.floor(_y);
		if (
			(_x >= 0)
			&& (_x < this.x)
			&& (_y >= 0)
			&& (_y < this.y)
		) {
			if (this.celulas[_x] == undefined) {
				return null;
			}
			if (this.celulas[_x][_y] == undefined) {
				return null;
			}
			return this.celulas[_x][_y];
		}
		return null;
	}
	computarOrigens(_numOrigens = 1) {
		let celulaOrigem = this.obterCelula(this.x / 2,0);
		celulaOrigem.el.style.borderTop = "0px";
		this.origens.push(celulaOrigem);
	}
	destruir() {
		this.pecas.forEach(_peca => {
			_peca.destruir();
		});
		this.pecas = [];
		this.celulas.forEach(_posX => {
			_posX.forEach(_celula => {
				_celula.destruir();
			});
		});
		this.celulas = [];
		divAreaTabuleiro.removeChild(this.el);
		this.filas.forEach(_fila => {
			_fila.destruir();
		});
		tabuleiro = null;
	}
}
class Celula {
	constructor(_tabuleiro,_x,_y) {
		this.tabuleiro = _tabuleiro;
		this.x = _x;
		this.y = _y;
		this.el = document.createElement("div");
		this.el.classList.add("celula");
		this.el.style.order = (this.y * this.tabuleiro.x) + this.x;
		this.tabuleiro.el.appendChild(this.el);
		this.slot = null;
		this.viz = [
			null,
			null,
			null,
			null
		];
		this.computado = false;
	}
	computarSlot(_slot) {
		this.slot = _slot;
		this.computado = true;
		if (this.slot != null) {
			//this.el.classList.add("debug");
		} else {
			//this.el.classList.remove("debug");
		}
	}
	computarVizinhos() {
		this.viz[0] = this.tabuleiro.obterCelula(this.x+1,this.y);
		this.viz[1] = this.tabuleiro.obterCelula(this.x,this.y-1);
		this.viz[2] = this.tabuleiro.obterCelula(this.x-1,this.y);
		this.viz[3] = this.tabuleiro.obterCelula(this.x,this.y+1);
		for (let i = 0; i < 4; i++) {
			if (this.viz[i] != null) {
				let viz180 = i+2;
				if (viz180 > 3) {
					viz180 -= 4;
				}
				this.viz[i].viz[viz180] = this;
			} else {
				switch (i) {
					case 0: this.el.style.borderRight = "4px groove #888"; break;
					case 1: this.el.style.borderTop = "4px groove #888"; break;
					case 2: this.el.style.borderLeft = "4px groove #888"; break;
					case 3: this.el.style.borderBottom = "4px groove #888"; break;
				}
			}
		}
	}
	destruir() {
		this.tabuleiro.el.removeChild(this.el);
	}
}
class Peca {
	constructor(_tabuleiro,_x,_y,_slots=2) {
		this.tabuleiro = _tabuleiro;
		this.id = this.tabuleiro.pecas.length;
		this.tabuleiro.pecas.push(this);
		this.x = _x;
		this.y = _y;
		this.tamanho = 0;
		this.slots = [];
		this.gerarSlots(_slots);
		this.atualizarVisual();
		this.tipoBolas = -1;
	}
	gerarSlots(_slots) {
		let xGerar = this.x;
		let yGerar = this.y;
		this.slots = [];
		let slotsGerados = 0;
		let tentativas = 0;
		while (slotsGerados < _slots) {
			if (this.tabuleiro.celulas[xGerar][yGerar].slot == null) {
				let novoSlot = new Slot(this,xGerar,yGerar);
				slotsGerados++;
				tentativas = 0;
			} else {
				if (tentativas >= 50) {
					console.log(`Peça ${this.id}: Está difícil achar célula livre. Abortando criação de novos slots...`);
					break;
				}
				tentativas++;
				if (slotsGerados > 0) {
					let slotSelecionado = this.slots[Math.floor((Math.random()*slotsGerados))];
					xGerar = slotSelecionado.x;
					yGerar = slotSelecionado.y;
					tentativas++;
				}
				if (Math.random()>=0.5) {
					if (xGerar > 0 && xGerar < this.tabuleiro.x - 1) {
						xGerar+=(Math.random()>=0.5)?1:-1;
					} else if (xGerar > 0) {
						xGerar-=1;
					} else if (xGerar < this.tabuleiro.x - 1) {
						xGerar+=1;
					}
				} else {
					if (yGerar > 0 && yGerar < this.tabuleiro.y - 1) {
						yGerar+=(Math.random()>=0.5)?1:-1;
					} else if (yGerar > 0) {
						yGerar-=1;
					} else if (yGerar < this.tabuleiro.y - 1) {
						yGerar+=1;
					}
				}
			}
		}
		if (this.slots.length == 0) {
			console.log(`AVISO: Peça ${this.id} não foi criada com sucesso!!`);
			return false;
		}
		console.log(`Peça ${this.id} criada com ${this.slots.length} slots`);
	}
	reposicionarSlots() {
		this.slots.forEach(_slot => {
			_slot.atualizarPosicao();
		});
	}
	atualizarVisual() {
		this.slots.forEach(_slot => {
			_slot.atualizarVisual();
		});
	}
	selecionarPeca() {

	}
	desselecionarPeca() {
		this.computarSlots();
	}
	livreDireita() {
		let podeMover = true;
		this.slots.forEach(_slot => {
			if (_slot.x == this.tabuleiro.x-1) {
				podeMover = false;
			} else if (_slot.celula.viz[0].slot != null) {
				if (_slot.celula.viz[0].slot.peca.id != this.id) {
					podeMover = false;
				}
			}
		});
		return podeMover;
	}
	livreAcima() {
		let podeMover = true;
		this.slots.forEach(_slot => {
			if (_slot.y == 0) {
				podeMover = false;
			} else if (_slot.celula.viz[1].slot != null) {
				if (_slot.celula.viz[1].slot.peca.id != this.id) {
					podeMover = false;
				}
			}
		});
		return podeMover;
	}
	livreEsquerda() {
		let podeMover = true;
		this.slots.forEach(_slot => {
			if (_slot.x == 0) {
				podeMover = false;
			} else if (_slot.celula.viz[2].slot != null) {
				if (_slot.celula.viz[2].slot.peca != this) {
					podeMover = false;
				}
			}
		});
		return podeMover;
	}
	livreAbaixo() {
		let podeMover = true;
		this.slots.forEach(_slot => {
			if (_slot.y == this.tabuleiro.y-1) {
				podeMover = false;
			} else if (_slot.celula.viz[3].slot != null) {
				if (_slot.celula.viz[3].slot.peca != this) {
					podeMover = false;
				}
			}
		});
		return podeMover;
	}
	moverDireita() {
		if (!this.livreDireita()) {
			//console.log("Não pode mover para direita");
			return false;
		}
		this.descomputarSlots();
		this.x += 1;
		this.slots.forEach(_slot => {
			_slot.posicionar(_slot.x+1,_slot.y,false);
		});
		this.reposicionarSlots();
		return true;
	}
	moverAcima() {
		if (!this.livreAcima()) {
			//console.log("Não pode mover para cima");
			return false;
		}
		this.descomputarSlots();
		this.y -= 1;
		this.slots.forEach(_slot => {
			_slot.posicionar(_slot.x,_slot.y-1,false);
		});
		this.reposicionarSlots();
		return true;
	}
	moverEsquerda() {
		if (!this.livreEsquerda()) {
			//console.log("Não pode mover para esquerda");
			return false;
		}
		this.descomputarSlots();
		this.x -= 1;
		this.slots.forEach(_slot => {
			_slot.posicionar(_slot.x-1,_slot.y,false);
		});
		this.reposicionarSlots();
		return true;
	}
	moverAbaixo() {
		if (!this.livreAbaixo()) {
			//console.log("Não pode mover para baixo");
			return false;
		}
		this.descomputarSlots();
		this.y -= 1;
		this.slots.forEach(_slot => {
			_slot.posicionar(_slot.x,_slot.y+1,false);
		});
		this.reposicionarSlots();
		return true;
	}
	computarSlots() {
		let adquirirBola = false;
		let slotsLivres = [];
		this.tabuleiro.origens.forEach(_origem => {
			this.slots.forEach(_slot => {
				if (_slot.bola == null) {
					slotsLivres.push(_slot);
				}
				if (_origem == _slot.celula) {
					adquirirBola = true;
				};
			});
		});
		if (!adquirirBola) return false;
		if (slotsLivres.length == 0) {
			sfxPeca.play();
			this.destruir();
			return false;
		}

		if (proximaBola() != null) {
			if (this.tipoBolas == -1) {
				this.tipoBolas = proximaBola().cor;
			};
			if (proximaBola().cor == this.tipoBolas) {
				let bolaExtraida = extrairProximaBola();
				slotsLivres[0].obterBola(bolaExtraida);
				//console.log(bolaExtraida);
				sfxBola.play();
				setTimeout(()=>{
					this.computarSlots()
				}, 100);
				return true;
			}
		}
		return false;
	}
	descomputarSlots() {
		this.slots.forEach(_slot => {
			if (_slot.celula != null) {
				_slot.celula.computarSlot(null);
				_slot.celula = null;
			}
		});
	}
	deslizarDireita() {
		while (this.moverDireita()) {
			//console.log("Deslizando pra direita...");
		}
	}
	deslizarAcima() {
		while (this.moverAcima()) {
			//console.log("Deslizando pra cima...");
		}
	}
	deslizarEsquerda() {
		while (this.moverEsquerda()) {
			//console.log("Deslizando pra esquerda...");
		}
	}
	deslizarAbaixo() {
		while (this.moverAbaixo()) {
			//console.log("Deslizando pra baixo...");
		}
	}
	//Função monstra que faz a peça deslizar pelo tabuleiro, procurando um lugar pra se "encaixar" (3 lados impedidos)
	procurarEncaixe() {
		let tentativa = 0;
		let encaixes = 4;
		console.log(`Procurando encaixe da peça ${this.id}`);
		while (encaixes > 1) {
			if (tentativa == 50) {
				console.log("Desisto de tentar mover!");
				break;
			}
			if (tentativa == 0) {
				this.deslizarAbaixo();
			} else {
				switch (Math.floor(Math.random()*4)) {
					case 0: this.deslizarDireita(); break;
					case 1:
						if (tentativa < 40) {
							this.deslizarAbaixo();
						} else {
							this.deslizarAbaixo();
						}
						break;
					case 2: this.deslizarEsquerda(); break;
					case 3: this.deslizarAbaixo(); break;
				}
			}
			encaixes = 0;
			if (this.livreDireita()) encaixes++;
			if (this.livreAcima()) encaixes++;
			if (this.livreEsquerda()) encaixes++;
			if (this.livreAbaixo()) encaixes++;
			if (encaixes <= 1) {
				console.log("Encaixou!");
			}
			tentativa++;
		}
	}
	destruir() {
		this.descomputarSlots();
		this.slots.forEach(_slot => {
			this.tabuleiro.el.removeChild(_slot.el);
		});
	}
}
class Slot {
	constructor(_peca,_x,_y) {
		this.peca = _peca;
		this.id = this.peca.slots.length;
		this.peca.slots.push(this);
		this.el = document.createElement("div");
		this.el.classList.add("slot");
		//this.el.innerText = `${this.peca.id}-${this.id}`;
		this.el.onmousedown = (_ev) => {
			selecionarPeca(this.peca,_ev);
		}
		this.x = _x;
		this.y = _y;
		this.celula = null;
		this.posicionar(_x,_y);
		this.peca.tabuleiro.el.appendChild(this.el);
		this.bola = null;
	}
	posicionar(_x,_y,_atualizarPos = true) {
		if (this.celula != null) {
			this.celula.computarSlot(null);
		}
		this.x = _x;
		this.y = _y;
		this.celula = this.peca.tabuleiro.celulas[this.x][this.y];
		this.celula.computarSlot(this);
		if (_atualizarPos) {
			this.atualizarPosicao();
		}
	}
	atualizarPosicao() {
		this.el.style.left = (this.celula.el.offsetLeft) + "px";
		this.el.style.top = (this.celula.el.offsetTop) + "px";
	}
	atualizarVisual() {
		this.el.style.borderTopLeftRadius = null;
		this.el.style.borderTopRightRadius = null;
		this.el.style.borderBottomRightRadius = null;
		this.el.style.borderBottomLeftRadius = null;

		if (this.verificaVizinho(0)) {
			this.el.style.borderTopRightRadius = "0px";
			this.el.style.borderBottomRightRadius = "0px";
			this.el.style.borderRightWidth = "0px";
		}
		if (this.verificaVizinho(1)) {
			this.el.style.borderTopRightRadius = "0px";
			this.el.style.borderTopLeftRadius = "0px";
			this.el.style.borderTopWidth = "0px";
		}
		if (this.verificaVizinho(2)) {
			this.el.style.borderTopLeftRadius = "0px";
			this.el.style.borderBottomLeftRadius = "0px";
			this.el.style.borderLeftWidth = "0px";
		}
		if (this.verificaVizinho(3)) {
			this.el.style.borderBottomLeftRadius = "0px";
			this.el.style.borderBottomRightRadius = "0px";
			this.el.style.borderBottomWidth = "0px";
		}
	}
	verificaVizinho(_viz) {
		if (this.celula.viz[_viz]!=null) {
			if (this.celula.viz[_viz].slot != null) {
				if (this.celula.viz[_viz].slot.peca.id == this.peca.id) {
					return true;
				}
			}
		}
		return false;
	}
	obterBola(_bola) {
		this.bola = _bola;
		this.el.appendChild(this.bola.el);
	}
}
class Fila {
	constructor(_dir,_tam) {
		this.dir = _dir;
		this.tam = _tam;
		this.id = filas.length;
		filas.push(this);
		this.bolas = [];

		this.el = document.createElement("div");
		this.el.classList.add("fila");

		switch (this.dir) {
			case 0:
				this.el.style.flexDirection = "row-reverse";
				break;
			case 1:
				this.el.style.flexDirection = "column";
				break;
			case 2:
				this.el.style.flexDirection = "row";
				break;
			case 3:
				this.el.style.flexDirection = "column-reverse";
				this.el.style.alignItems = "center";
				break;
		}

		divAreaBolas.appendChild(this.el);
	}
	adicionarBola(_cor) {
		let novaBola = new Bola(this,_cor);
		//this.el.scrollTop = this.el.offsetHeight;
	}
	extrairProximaBola() {
		let bolaExtraida = this.bolas.shift();
		this.el.removeChild(bolaExtraida.el);
		return bolaExtraida;
	}
	destruir() {
		this.bolas.forEach(_bola => {
			this.el.removeChild(_bola.el);
		});
		this.bolas = [];
		divAreaBolas.removeChild(this.el);
	}
}
class Bola {
	constructor(_fila,_cor) {
		this.fila = _fila;
		this.cor = _cor;
		this.fila.bolas.push(this);

		this.el = document.createElement("div");
		this.el.classList.add("bola");

		this.el.classList.add("cor"+this.cor);
		this.fila.el.appendChild(this.el);
	}
}

//#region Funções

function selecionarPeca(_peca,_ev) {
	if (pecaSelecionada != null) {
		desselecionarPeca();
	}
	pecaSelecionada = _peca;
	origX = _ev.clientX;
	origY = _ev.clientY;
	document.addEventListener("mousemove", moverPeca);
	console.log(`Peça ${pecaSelecionada.id} selecionada`);
}
function desselecionarPeca() {
	pecaSelecionada.desselecionarPeca();
	document.removeEventListener("mousemove", moverPeca);
	console.log(`Peça ${pecaSelecionada.id} desselecionada`);
	pecaSelecionada = null;
}
function moverPeca(_ev) {
	if (_ev.clientX > origX + 25) {
		if(pecaSelecionada.moverDireita()) {
			sfxMover.play();
			origX+=50;
		}
	}
	if (_ev.clientX < origX - 25) {
		if(pecaSelecionada.moverEsquerda()) {
			sfxMover.play();
			origX-=50;
		}
	}
	if (_ev.clientY > origY + 25) {
		if(pecaSelecionada.moverAbaixo()) {
			sfxMover.play();
			origY+=50;
		}
	}
	if (_ev.clientY < origY - 25) {
		if(pecaSelecionada.moverAcima()) {
			sfxMover.play();
			origY-=50;
		}
	}
}
function adicionarBola(_cor = -1) {
	let filaId = 0;
	let filaAdicionar = filas[filaId];
	while (filaAdicionar.bolas.length == filaAdicionar.tam) {
		filaId++;
		if (filaId == filas.length) {
			console.log("Não dá mais pra adicionar bolas! Aumente as filas!!");
			return false;
		}
		filaAdicionar = filas[filaId];
	}
	if (_cor == -1) {
		_cor = Math.floor(Math.random()*8);
	}
	filaAdicionar.adicionarBola(_cor);
}
function proximaBola() {
	if (filas[0].bolas.length > 0) {
		return filas[0].bolas[0];
	}
	return null;
}
function extrairProximaBola() {
	if (proximaBola() != null) {
		let bolaExtraida = filas[0].extrairProximaBola();
		return bolaExtraida;
	}
	return null;
}
function criarBolasAleatorias(_num,_limitCor = 8) {
	let cor = Math.floor(Math.random()*_limitCor);
	for (let i = 0; i < _num; i++) {
		adicionarBola(cor);
	}
}
function iniciarNovoJogo() {
	if (tabuleiro != null) {
		tabuleiro.destruir();
	}
	new Fila(3,0);
	new Tabuleiro(9,9);
	sfxTabuleiro.play();
}

//#region Event Listeners

document.addEventListener("keydown",(ev)=>{
	if (pecaSelecionada != null) {
		switch(ev.key) {
			case "ArrowUp":
				pecaSelecionada.deslizarAcima();
				break;
			case "ArrowDown":
				pecaSelecionada.deslizarAbaixo();
				break;
			case "ArrowLeft":
				pecaSelecionada.deslizarEsquerda();
				break;
			case "ArrowRight":
				pecaSelecionada.deslizarDireita();
				break;
		}
	}
});
document.addEventListener("mouseup",(ev)=>{
	if (pecaSelecionada != null) {
		desselecionarPeca();
	}
});
window.addEventListener("resize",(ev)=>{
	if (tabuleiro != null) {
		tabuleiro.reposicionarPecas();
	}
});
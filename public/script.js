const divAreaTabuleiro = document.getElementById("areaTabuleiro");

var tabuleiro = null;
var pecaSelecionada = null;

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
		this.gerarPecas();
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
	gerarPecas(_numPecas = 5) {
		for (let i = 0; i < _numPecas; i++) {
			let origem = this.origens[Math.floor(Math.random()*this.numOrigens)];
			let novaPeca = this.gerarPeca(origem.x,origem.y,_numPecas);
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
				if (tentativas >= 5) {
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
	descomputarSlots() {
		this.slots.forEach(_slot => {
			_slot.celula.computarSlot(null);
			_slot.celula = null;
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
		while (encaixes > 1) {
			if (tentativa == 50) {
				console.log("Desisto de tentar mover!");
				break;
			}
			switch (Math.floor(Math.random()*4)) {
				case 0: this.deslizarDireita(); break;
				case 1: this.deslizarAcima(); break;
				case 2: this.deslizarEsquerda(); break;
				case 3: this.deslizarAbaixo(); break;
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
}

class Slot {
	constructor(_peca,_x,_y) {
		this.peca = _peca;
		this.id = this.peca.slots.length;
		this.peca.slots.push(this);
		this.el = document.createElement("div");
		this.el.classList.add("slot");
		this.el.innerText = `${this.peca.id}-${this.id}`;
		this.el.onmousedown = (_ev) => {
			selecionarPeca(this.peca,_ev);
		}
		this.x = _x;
		this.y = _y;
		this.celula = null;
		this.posicionar(_x,_y);
		this.peca.tabuleiro.el.appendChild(this.el);
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
		}
		if (this.verificaVizinho(1)) {
			this.el.style.borderTopRightRadius = "0px";
			this.el.style.borderTopLeftRadius = "0px";
		}
		if (this.verificaVizinho(2)) {
			this.el.style.borderTopLeftRadius = "0px";
			this.el.style.borderBottomLeftRadius = "0px";
		}
		if (this.verificaVizinho(3)) {
			this.el.style.borderBottomLeftRadius = "0px";
			this.el.style.borderBottomRightRadius = "0px";
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
}

var origX = 0;
var origY = 0;

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
			origX+=50;
		}
	}
	if (_ev.clientX < origX - 25) {
		if(pecaSelecionada.moverEsquerda()) {
			origX-=50;
		}
	}
	if (_ev.clientY > origY + 25) {
		if(pecaSelecionada.moverAbaixo()) {
			origY+=50;
		}
	}
	if (_ev.clientY < origY - 25) {
		if(pecaSelecionada.moverAcima()) {
			origY-=50;
		}
	}
}

new Tabuleiro(9,5);
console.log(tabuleiro);

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
})
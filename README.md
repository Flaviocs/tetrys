# 🕹️ TETRIS Arcade Moderno

Um clássico jogo de Tetris recriado com estética arcade retrô/cyberpunk, efeitos sonoros sintetizados via **Web Audio API**, sistema de rotação com wall kicks (SRS), fila de próximas peças, reserva de peças (hold), sombra da peça (ghost piece), partículas e suporte a controles tanto por teclado quanto por toque na tela (touch).

---

## 🚀 Como Jogar

Você pode jogar de duas formas muito simples:

### Opção 1: Abrir diretamente no navegador
Basta abrir o arquivo [`index.html`](file:///home/user/projeto01/index.html) em qualquer navegador moderno (Chrome, Firefox, Edge, Safari).

### Opção 2: Iniciar servidor local
Execute no terminal dentro da pasta do projeto:

```bash
python3 server.py
```
ou
```bash
npm start
```

Em seguida, acesse no navegador: **`http://localhost:8080`**

---

## 🎮 Controles

| Ação | Teclado | Controles na Tela |
| :--- | :--- | :--- |
| **Mover para a esquerda** | `←` ou `A` | Botão `← Esq` |
| **Mover para a direita** | `→` ou `D` | Botão `→ Dir` |
| **Girar Horário** | `↑` ou `W` ou `X` | Botão `↻ Girar` |
| **Girar Anti-Horário** | `Z` | — |
| **Queda Rápida (Soft Drop)** | `↓` ou `S` | Botão `↓ Descer` |
| **Queda Instantânea (Hard Drop)** | `Barra de Espaço` | Botão `⤓ Drop` |
| **Guardar Peça (Hold)** | `C` ou `Shift` | Botão `⇄ Hold` |
| **Pausar / Continuar** | `P` ou `Esc` | Botão `⏸ Pausar` |
| **Reiniciar Partida** | `R` | Botão `🔄 Reiniciar` |

---

## ✨ Funcionalidades e Mecânicas

- **Super Rotation System (SRS) & Wall Kicks:** Gire peças perto das paredes ou de outros blocos suavemente sem travar.
- **7-Bag Randomizer:** Garante uma distribuição equilibrada de todas as 7 peças clássicas (I, J, L, O, S, T, Z) sem sequências injustas.
- **Ghost Piece:** Projeção translúcida mostrando exatamente onde a peça vai cair.
- **Hold System:** Guarde uma peça para usar no momento estratégico (1 troca por peça).
- **Fila de Próximas:** Visualize as próximas 3 peças que entrarão no tabuleiro.
- **Lock Delay:** Margem de 500ms ao tocar o solo antes de fixar o bloco, permitindo ajustes e giros de última hora.
- **Efeitos Visuais:**
  - Animação de flash e partículas ao limpar linhas.
  - Efeito de impacto na tela (screen shake) no Hard Drop e Tetris.
  - Pontuação flutuante dinâmica.
- **Efeitos Sonoros e Música Chiptune:**
  - Áudio 100% sintetizado diretamente via **Web Audio API** (sem arquivos externos pesados ou problemas de carregamento).
  - Trilha sonora 8-bit opcional do clássico tema russo (*Korobeiniki*), com botão de ligar/desligar.
- **Recorde Persistente:** O melhor resultado é salvo no `localStorage` do navegador.

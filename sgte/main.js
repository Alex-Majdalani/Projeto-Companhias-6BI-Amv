// Botões da Página do Sargenteante
const botoes = document.querySelectorAll(".box");

botoes.forEach((botao) => {
  botao.addEventListener("click", () => {
    const acao = botao.getAttribute("data-action");

    // Ação para cada botão da página
    switch (acao) {
      case "cadastro":
        window.location.href = "Cadastro-de-militares.html";
        break;
      case "aditamento":
        window.location.href = "Aditamento.html";
        break;
      case "pernoite":
        window.location.href = "Pernoite.html";
        break;
      case "acidente":
        window.location.href = "Parte-de-acidente.html";
        break;
      case "fatd":
        window.location.href = "FATD.html";
        break;
      case "ficha":
        window.location.href = "Ficha-modelo-E.html";
        break;
      default:
        alert("Ação não definida");
    }
  });
});
//--------------------------------------------------------------
//Botão de cadastro na pagina login
const botaoCadastro = document.getElementById("ilog");
function clicar() {
  botaoCadastro.click();
  window.location.href = "cadastro.html";
}

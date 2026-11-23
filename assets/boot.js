/* Nexo — roda antes de desenhar a página.
   1. Marca que o JavaScript está ativo (as animações dependem disso).
   2. Impede que outro site exiba esta página dentro dele (iframe). */
document.documentElement.classList.add("js");
if (window.self !== window.top) {
  document.documentElement.style.visibility = "hidden";
  try { window.top.location.replace(window.location.href); } catch (e) {}
}

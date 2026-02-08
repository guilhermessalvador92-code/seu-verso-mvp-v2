/**
 * Detecta se a aplicação está rodando em ambiente LAB.
 *
 * O ambiente LAB é identificado pelo prefixo "lab." no hostname
 * (ex: lab.seuverso.com.br). Em qualquer outro hostname — incluindo
 * produção, localhost e preview deploys — a função retorna false.
 *
 * Seguro para SSR/testes: retorna false quando `window` não existe.
 */
export function isLabEnvironment(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.startsWith("lab.");
}

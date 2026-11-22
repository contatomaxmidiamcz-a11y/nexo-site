# Nexo — site (nexoassist.com)

Landing page do Nexo, assistente pessoal no WhatsApp.

- Página única: `index.html`, sem dependências externas (logotipo embutido, fontes do sistema).
- Publicação: GitHub Pages, a partir da branch `main`, pasta raiz. O domínio está no arquivo `CNAME`.

## Trocar o link de pagamento

No `index.html`, procure o bloco `nexo-config` e troque só os endereços entre aspas:

```json
{
  "pagamento": {
    "mensal": "https://pay.hotmart.com/...",
    "semestral": ""
  }
}
```

- Período vazio (`""`) fica oculto na página. Com dois períodos preenchidos, o seletor Mensal/Semestral aparece.
- Só são aceitos links `https` de `pay.hotmart.com` e `buy.stripe.com`.
- Não altere o restante dos scripts: a página tem uma política de segurança (CSP) que só executa o código original.
  Mudar o bloco `nexo-config` é seguro; mudar outro script faz a página parar de funcionar até ser gerada de novo.

## Segurança

- Ative a verificação em duas etapas (2FA) no GitHub e na conta onde o DNS do domínio é gerenciado.
- Mantenha o domínio verificado no GitHub (Settings do perfil › Pages) para evitar que outra conta o use.
- Em Settings › Pages deste repositório, deixe **Enforce HTTPS** marcado.

## Google e compartilhamento

- `robots.txt` e `sitemap.xml` indicam a página ao Google. Ao mudar a página, atualize a data em `<lastmod>` no `sitemap.xml`.
- `og-image.png` é a imagem de prévia quando o link é compartilhado (WhatsApp, redes sociais).
- Se o preço mudar, atualize também a descrição (`meta name="description"`), as tags `og:description` e o bloco `application/ld+json` no `index.html`.

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { emailDeSuporte, marcaDaSaida } from "@/lib/branding/saida";
import { idiomaDoVisitante } from "@/lib/i18n/idiomaAnonimo";
import { traduzir } from "@/lib/i18n/dicionario";
import { valorDaInstalacao } from "@/lib/instalacao/config";
import { createClient } from "@/lib/supabase/server";

import "./vitrine.css";

/**
 * A página inicial pública.
 *
 * Quem tem sessão segue direto para o painel, como sempre foi. Quem não tem vê
 * uma vitrine que diz o que o produto é, como funciona, como os dados do Google
 * são usados, e leva à política de privacidade e aos termos — sem pedir login. A
 * verificação de um app que pede dados de conta Google exige exatamente isso: o
 * revisor abre o endereço principal sem entrar e precisa ver o nome do produto,
 * o que ele faz e o link da política.
 *
 * `/` já é caminho público no `proxy` (`lib/auth/public-paths.ts`), então nada
 * lá muda. Nome, logo e cor vêm da marca resolvida (`marcaDaSaida`: banco acima
 * do `.env`), nunca de texto fixo: uma imagem serve todas as marcas. Os contatos
 * vêm da instalação — `SUPPORT_EMAIL` e `SUPPORT_WHATSAPP`, editáveis em
 * Administração › Configuração — e o botão some quando o valor está vazio, em
 * vez de cair num contato do produto.
 *
 * `getUser()` e nunca `getSession()`: o redirecionamento só vale para sessão que
 * o servidor de autenticação confirmou.
 */
export const dynamic = "force-dynamic";

/** Só dígitos, com DDI. Qualquer outra coisa vira "sem WhatsApp". */
function numeroDeWhatsapp(valor: string | null | undefined): string | null {
  const digitos = (valor ?? "").replace(/\D/g, "");
  return digitos.length >= 10 && digitos.length <= 15 ? digitos : null;
}

function linkDoWhatsapp(numero: string, mensagem: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
}

function IconeWhatsapp() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43a9.38 9.38 0 0 1 9.43 9.44c0 5.2-4.24 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.71 5.8.71 12.05c0 2 .52 3.95 1.52 5.66L.62 23.6l6.02-1.58a11.3 11.3 0 0 0 5.41 1.38h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.32-8.02" />
    </svg>
  );
}

function IconeTraco({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

const ICONE_AGENDA = (
  <IconeTraco>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </IconeTraco>
);

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/app");

  const marca = await marcaDaSaida(null);
  const idioma = await idiomaDoVisitante(null);
  const t = (texto: string) => traduzir(texto, idioma);
  const whatsapp = numeroDeWhatsapp((await valorDaInstalacao("SUPPORT_WHATSAPP")).valor);
  const email = await emailDeSuporte();
  const logo = marca.logoDarkUrl || marca.logoUrl;
  const inicial = Array.from(marca.nome.trim())[0]?.toUpperCase() ?? "";
  const ano = new Date().getFullYear();

  const conhecer = whatsapp
    ? linkDoWhatsapp(whatsapp, `${t("Olá! Quero conhecer o")} ${marca.nome}.`)
    : null;
  const demonstracao = whatsapp
    ? linkDoWhatsapp(whatsapp, `${t("Olá! Quero uma demonstração do")} ${marca.nome}.`)
    : null;

  const estilo = {
    "--acento": marca.accent,
    "--acento-fg": marca.accentFg,
  } as CSSProperties;

  const logoDaMarca = (
    <>
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element -- URL da marca vem do banco, fora do domínio de imagens do next/image
        <img src={logo} alt="" className="vt-marcaLogo" />
      ) : (
        <span className="vt-marcaInicial" aria-hidden="true">
          {inicial}
        </span>
      )}
      <span>{marca.nome}</span>
    </>
  );

  return (
    <div className="vt-pagina" style={estilo}>
      <header className="vt-topo">
        <div className="vt-wrap vt-nav">
          <Link href="/" className="vt-marca" aria-label={marca.nome}>
            {logoDaMarca}
          </Link>
          <nav className="vt-links" aria-label={t("Principal")}>
            <a href="#recursos">{t("Recursos")}</a>
            <a href="#como-funciona">{t("Como funciona")}</a>
            <a href="#dados-do-google">{t("Dados do Google")}</a>
            <Link href="/login" className="vt-btn vt-btnFantasma vt-btnPequeno">
              {t("Entrar")}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="vt-hero">
          <div className="vt-wrap vt-heroGrade">
            <div>
              <span className="vt-selo">
                <i aria-hidden="true" />
                {t("WhatsApp com inteligência artificial")}
              </span>
              <h1 className="vt-titulo">{marca.nome}</h1>
              <p className="vt-titulo vt-apoio">
                <span className="vt-gradiente">{t("Nenhum cliente esperando no WhatsApp.")}</span>
              </p>
              <p className="vt-lead">
                {t("O")} {marca.nome}{" "}
                {t(
                  "reúne em um só lugar as conversas com os clientes, o funil de vendas, a agenda de atendimentos e agentes de inteligência artificial que respondem, qualificam o interesse e passam a conversa para uma pessoa quando é preciso.",
                )}
              </p>
              <div className="vt-heroCta">
                {conhecer ? (
                  <a
                    className="vt-btn vt-btnWa"
                    href={conhecer}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <IconeWhatsapp />
                    {t("Quero conhecer")}
                  </a>
                ) : null}
                <Link
                  href="/login"
                  className={`vt-btn ${conhecer ? "vt-btnFantasma" : "vt-btnAcento"}`}
                >
                  {t("Já sou cliente, entrar")}
                </Link>
              </div>
              <ul className="vt-confianca">
                <li>
                  <IconeTraco>
                    <path d="M20 6 9 17l-5-5" />
                  </IconeTraco>
                  {t("Atendimento 24 horas")}
                </li>
                <li>
                  <IconeTraco>
                    <path d="M20 6 9 17l-5-5" />
                  </IconeTraco>
                  {t("Uma pessoa assume quando precisa")}
                </li>
                <li>
                  <IconeTraco>
                    <path d="M20 6 9 17l-5-5" />
                  </IconeTraco>
                  {t("Funil e agenda no mesmo lugar")}
                </li>
              </ul>
            </div>

            <div className="vt-visual" aria-hidden="true">
              <div className="vt-mock">
                <div className="vt-mockTopo">
                  <i />
                  <i />
                  <i />
                  <em>{marca.nome}</em>
                </div>
                <div className="vt-mockCorpo">
                  <div className="vt-caixa">
                    <div className="vt-item vt-itemAtivo">
                      <span className="vt-avatar" style={{ background: "#2563EB" }}>
                        MS
                      </span>
                      <span>
                        <b>Mariana S.</b>
                        <small>{t("Tem horário amanhã?")}</small>
                      </span>
                    </div>
                    <div className="vt-item">
                      <span className="vt-avatar" style={{ background: "#16A34A" }}>
                        RC
                      </span>
                      <span>
                        <b>Rafael C.</b>
                        <small>{t("Qual o valor do plano?")}</small>
                      </span>
                    </div>
                    <div className="vt-item">
                      <span className="vt-avatar" style={{ background: "#9333EA" }}>
                        LP
                      </span>
                      <span>
                        <b>Loja Prado</b>
                        <small>{t("Pedido confirmado")}</small>
                      </span>
                    </div>
                    <div className="vt-item">
                      <span className="vt-avatar" style={{ background: "#EA580C" }}>
                        JA
                      </span>
                      <span>
                        <b>Julia A.</b>
                        <small>{t("Obrigada pelo retorno!")}</small>
                      </span>
                    </div>
                  </div>
                  <div className="vt-conversa">
                    <div className="vt-msg vt-msgEntra">
                      {t("Oi! Vocês têm horário amanhã à tarde?")}
                    </div>
                    <div className="vt-msg vt-msgIa">
                      <span className="vt-etiqueta">✦ {t("Agente de IA")}</span>
                      {t(
                        "Olá, Mariana! Amanhã tenho estes horários livres. Qual fica melhor para você?",
                      )}
                    </div>
                    <div className="vt-horarios">
                      <span>14:00</span>
                      <span>15:30</span>
                      <span>17:00</span>
                    </div>
                    <div className="vt-msg vt-msgEntra">{t("15:30, por favor")} 😊</div>
                    <div className="vt-msg vt-msgIa">
                      <span className="vt-etiqueta">✦ {t("Agente de IA")}</span>
                      {t("Pronto! Agendado para amanhã às 15:30. Até lá!")}
                    </div>
                  </div>
                </div>
              </div>
              <div className="vt-aviso vt-avisoCima">
                <span className="vt-avisoIcone" style={{ background: "rgba(59,130,246,.18)" }}>
                  📅
                </span>
                <span>
                  <b>{t("Novo agendamento")}</b>
                  <small>{t("Amanhã, 15:30")}</small>
                </span>
              </div>
              <div className="vt-aviso vt-avisoBaixo">
                <span className="vt-avisoIcone" style={{ background: "rgba(34,197,94,.18)" }}>
                  💰
                </span>
                <span>
                  <b>{t("Venda fechada")}</b>
                  <small>{t("Etapa: Ganho")}</small>
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="vt-secao vt-secaoAlt">
          <div className="vt-wrap">
            <div className="vt-cabeca vt-centro">
              <span className="vt-sobretitulo">{t("Recursos")}</span>
              <h2 className="vt-h2">{t("Tudo o que o seu atendimento precisa, em um só lugar")}</h2>
              <p className="vt-sub">
                {t("Sem planilha, sem conversa perdida e sem cliente esquecido no WhatsApp.")}
              </p>
            </div>
            <div className="vt-recursos">
              <article className="vt-cartao">
                <div className="vt-icone">
                  <IconeTraco>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </IconeTraco>
                </div>
                <h3>{t("Conversas centralizadas")}</h3>
                <p>
                  {t(
                    "Todas as mensagens do WhatsApp da empresa numa caixa de entrada só, com a equipe atendendo junto.",
                  )}
                </p>
              </article>
              <article className="vt-cartao">
                <div className="vt-icone">
                  <IconeTraco>
                    <rect x="3" y="3" width="5" height="18" rx="1.5" />
                    <rect x="10" y="3" width="5" height="12" rx="1.5" />
                    <rect x="17" y="3" width="4" height="7" rx="1.5" />
                  </IconeTraco>
                </div>
                <h3>{t("Funil de vendas")}</h3>
                <p>
                  {t("Veja em que etapa está cada cliente e saiba quem precisa de retorno hoje.")}
                </p>
              </article>
              <article className="vt-cartao">
                <div className="vt-icone">{ICONE_AGENDA}</div>
                <h3>{t("Agenda integrada")}</h3>
                <p>
                  {t(
                    "O cliente marca, remarca ou cancela o horário pela própria conversa, com a agenda sempre em dia.",
                  )}
                </p>
              </article>
              <article className="vt-cartao">
                <div className="vt-icone">
                  <IconeTraco>
                    <path d="M12 3l1.9 4.6L18.5 9l-4.6 1.9L12 15.5l-1.9-4.6L5.5 9l4.6-1.4z" />
                    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
                  </IconeTraco>
                </div>
                <h3>{t("Agentes de IA")}</h3>
                <p>
                  {t(
                    "Respondem na hora, qualificam o interesse e passam para uma pessoa quando a conversa pede.",
                  )}
                </p>
              </article>
            </div>
          </div>
        </section>

        <section id="como-funciona" className="vt-secao">
          <div className="vt-wrap">
            <div className="vt-cabeca">
              <span className="vt-sobretitulo">{t("Como funciona")}</span>
              <h2 className="vt-h2">{t("Pronto para atender em 3 passos")}</h2>
            </div>
            <ol className="vt-passos">
              <li className="vt-passo">
                <span className="vt-numero" aria-hidden="true">
                  1
                </span>
                <h3>{t("Conecte o WhatsApp")}</h3>
                <p>{t("O número da empresa entra no sistema pelo QR Code, em poucos minutos.")}</p>
              </li>
              <li className="vt-passo">
                <span className="vt-numero" aria-hidden="true">
                  2
                </span>
                <h3>{t("Configure o agente")}</h3>
                <p>
                  {t(
                    "O agente de IA aprende os serviços, os preços, os horários e o jeito de falar da marca.",
                  )}
                </p>
              </li>
              <li className="vt-passo">
                <span className="vt-numero" aria-hidden="true">
                  3
                </span>
                <h3>{t("Acompanhe as vendas")}</h3>
                <p>
                  {t(
                    "A equipe assume as conversas quentes e acompanha tudo pelo funil e pela agenda.",
                  )}
                </p>
              </li>
            </ol>
          </div>
        </section>

        <section id="dados-do-google" className="vt-secao vt-secaoAlt">
          <div className="vt-wrap vt-dados">
            <div>
              <span className="vt-sobretitulo">{t("Transparência")}</span>
              <h2 className="vt-h2">
                {t("Como o")} {marca.nome} {t("usa os dados do Google")}
              </h2>
              <p className="vt-sub">
                {t(
                  "As integrações com o Google são opcionais e só funcionam depois que a própria empresa autoriza a conexão. O acesso pode ser revogado a qualquer momento.",
                )}
              </p>
            </div>
            <div className="vt-listaGoogle">
              <div className="vt-google">
                <div className="vt-icone">{ICONE_AGENDA}</div>
                <div>
                  <h3>{t("Google Agenda")}</h3>
                  <p>
                    {t(
                      "Quando a empresa conecta o Google Agenda, o sistema mostra a ocupação da agenda e cria, altera e cancela os agendamentos pedidos pela própria pessoa.",
                    )}
                  </p>
                </div>
              </div>
              <div className="vt-google">
                <div className="vt-icone">
                  <IconeTraco>
                    <path d="M3 3v18h18" />
                    <path d="m7 15 4-4 3 3 5-6" />
                  </IconeTraco>
                </div>
                <div>
                  <h3>{t("Google Ads")}</h3>
                  <p>
                    {t(
                      "Quando a empresa conecta o Google Ads, o sistema devolve ao anúncio as vendas que ele trouxe, para mostrar quais campanhas dão resultado.",
                    )}
                  </p>
                </div>
              </div>
              <p className="vt-nota">
                {t(
                  "O uso e a transferência de informações recebidas das APIs do Google seguem a Política de Dados do Usuário dos Serviços de API do Google, incluindo os requisitos de Uso Limitado. Os detalhes estão na",
                )}{" "}
                <Link href="/legal/privacy#dados-do-google">{t("Política de Privacidade")}</Link>.
              </p>
            </div>
          </div>
        </section>

        {demonstracao || email ? (
          <section className="vt-secao">
            <div className="vt-wrap">
              <div className="vt-faixa">
                <div>
                  <h2 className="vt-h2">
                    {t("Quer ver o")} {marca.nome} {t("funcionando?")}
                  </h2>
                  <p>
                    {t(
                      "Fale com a gente e veja uma demonstração com o atendimento da sua empresa.",
                    )}
                  </p>
                </div>
                <div className="vt-faixaBotoes">
                  {demonstracao ? (
                    <a
                      className="vt-btn vt-btnWa"
                      href={demonstracao}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <IconeWhatsapp />
                      {t("Pedir demonstração")}
                    </a>
                  ) : null}
                  {email ? (
                    <a className="vt-btn vt-btnFantasma" href={`mailto:${email}`}>
                      {t("Enviar e-mail")}
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>

      <footer className="vt-rodape">
        <div className="vt-wrap">
          <div className="vt-rodapeGrade">
            <div>
              <Link href="/" className="vt-marca" aria-label={marca.nome}>
                {logoDaMarca}
              </Link>
              <p className="vt-rodapeTexto">
                {t("Atendimento e vendas pelo WhatsApp, com agentes de inteligência artificial.")}
              </p>
            </div>
            <nav aria-label={t("Produto")}>
              <h2>{t("Produto")}</h2>
              <ul>
                <li>
                  <a href="#recursos">{t("Recursos")}</a>
                </li>
                <li>
                  <a href="#como-funciona">{t("Como funciona")}</a>
                </li>
                <li>
                  <a href="#dados-do-google">{t("Dados do Google")}</a>
                </li>
                <li>
                  <Link href="/login">{t("Entrar")}</Link>
                </li>
              </ul>
            </nav>
            <nav aria-label={t("Contato e documentos")}>
              <h2>{t("Contato e documentos")}</h2>
              <ul>
                {whatsapp ? (
                  <li>
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </li>
                ) : null}
                {email ? (
                  <li>
                    <a href={`mailto:${email}`}>{email}</a>
                  </li>
                ) : null}
                <li>
                  <Link href="/legal/privacy">{t("Política de Privacidade")}</Link>
                </li>
                <li>
                  <Link href="/legal/terms">{t("Termos de Uso")}</Link>
                </li>
              </ul>
            </nav>
          </div>
          <p className="vt-copyright">
            © {ano} {marca.nome}. {t("Todos os direitos reservados.")}
          </p>
        </div>
      </footer>

      {conhecer ? (
        <a
          className="vt-waFlutuante"
          href={conhecer}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("Falar no WhatsApp")}
        >
          <IconeWhatsapp />
        </a>
      ) : null}
    </div>
  );
}

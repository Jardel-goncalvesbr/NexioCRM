import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const cena = vi.hoisted(() => ({
  usuario: null as { id: string } | null,
  whatsapp: null as string | null,
  email: "",
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destino: string) => {
    throw new Error(`NEXT_REDIRECT:${destino}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: cena.usuario } }) },
  }),
}));
vi.mock("@/lib/i18n/idiomaAnonimo", () => ({ idiomaDoVisitante: async () => "pt-BR" }));
const logoDaCena = vi.hoisted(() => ({ url: null as string | null }));
vi.mock("@/lib/branding/saida", () => ({
  marcaDaSaida: async () => ({
    nome: "Marca da Revenda",
    logoUrl: logoDaCena.url,
    accent: "#2563eb",
    accentFg: "#ffffff",
  }),
  emailDeSuporte: async () => cena.email,
}));
vi.mock("@/lib/instalacao/config", () => ({
  valorDaInstalacao: async () => ({ valor: cena.whatsapp }),
}));

import HomePage from "./page";

async function montar() {
  return render(await HomePage());
}

beforeEach(() => {
  cena.usuario = null;
  cena.whatsapp = null;
  cena.email = "";
});

describe("/ — a página inicial pública", () => {
  // A verificação de um app que pede dados de conta Google abre o endereço
  // principal SEM entrar. Antes, `/` era só um redirect para o painel e o
  // revisor caía no login.
  it("sem sessão: mostra o nome da marca, o que o produto faz e os links legais", async () => {
    await montar();

    expect(screen.getByRole("heading", { level: 1, name: "Marca da Revenda" })).toBeInTheDocument();
    expect(screen.getAllByText(/Atendimento e vendas pelo WhatsApp/).length).toBeGreaterThan(0);

    const politica = screen
      .getAllByRole("link", { name: "Política de Privacidade" })
      .map((a) => a.getAttribute("href"));
    expect(politica).toContain("/legal/privacy");
    expect(screen.getByRole("link", { name: "Termos de Uso" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    const entrar = screen
      .getAllByRole("link", { name: "Entrar" })
      .map((a) => a.getAttribute("href"));
    expect(entrar).toContain("/login");
  });

  it("o nome vem da marca resolvida, não de texto fixo", async () => {
    await montar();
    expect(document.body.textContent).toContain("Marca da Revenda");
  });

  it("com sessão: segue direto para o painel, como sempre foi", async () => {
    cena.usuario = { id: "11111111-1111-4111-8111-111111111111" };
    await expect(montar()).rejects.toThrow("NEXT_REDIRECT:/app");
  });

  // Os contatos são da instalação (Administração › Configuração). Vazio é
  // vazio: nenhum botão cai num contato do produto.
  it("sem contato configurado: não mostra botão de WhatsApp nem e-mail", async () => {
    await montar();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.includes("wa.me"))).toBe(false);
    expect(hrefs.some((h) => h.startsWith("mailto:"))).toBe(false);
  });

  it("com contato configurado: WhatsApp só com dígitos e e-mail de suporte", async () => {
    cena.whatsapp = "+55 (11) 99999-9999";
    cena.email = "contato@revenda.exemplo";
    await montar();
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("https://wa.me/5511999999999"))).toBe(true);
    expect(hrefs).toContain("mailto:contato@revenda.exemplo");
  });

  it("com logo, o nome não aparece escrito ao lado (o logo já o traz)", async () => {
    logoDaCena.url = "https://exemplo.test/logo.png";
    const { container } = await montar();
    const marca = container.querySelector("header a[href='/']");
    expect(marca?.querySelector("img")).not.toBeNull();
    expect(marca?.querySelector("span.sr-only")?.textContent).toBe("Marca da Revenda");
    logoDaCena.url = null;
  });
});

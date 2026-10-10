const json = (d, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

const DEFAULT = { site: { title: "Repositorios del curso", subtitle: "" }, sources: [], modules: [], overrides: {} };

async function getConfig(env) {
  const saved = (await env.KV.get("config", "json")) || {};
  const cfg = { ...DEFAULT, ...saved };
  if (!cfg.sources.length) {
    if (env.GITHUB_USER) cfg.sources.push({ type: "github", user: env.GITHUB_USER });
    if (env.GITLAB_USER) cfg.sources.push({ type: "gitlab", user: env.GITLAB_USER, host: "gitlab.com" });
  }
  return cfg;
}

async function fetchSource(s, env, refresh) {
  const cache = caches.default;
  const key = new Request(`https://cache.local/${s.type}/${s.host || ""}/${s.user}`);
  if (!refresh) {
    const hit = await cache.match(key);
    if (hit) return hit.json();
  }
  let list = [];
  try {
    if (s.type === "github") {
      const headers = { "user-agent": "portal-repos", accept: "application/vnd.github+json" };
      if (env.GITHUB_TOKEN) headers.authorization = `Bearer ${env.GITHUB_TOKEN}`;
      const r = await fetch(`https://api.github.com/users/${encodeURIComponent(s.user)}/repos?per_page=100&sort=updated&type=owner`, { headers });
      if (!r.ok) throw new Error(`GitHub ${r.status}`);
      list = (await r.json()).map((x) => ({
        id: `gh:${x.id}`, provider: "github", name: x.name, description: x.description || "",
        url: x.html_url, clone: x.clone_url, language: x.language || "", stars: x.stargazers_count,
        topics: x.topics || [], updated: x.pushed_at || x.updated_at, fork: x.fork, archived: x.archived,
      }));
    } else if (s.type === "gitlab") {
      const host = (s.host || "gitlab.com").replace(/^https?:\/\//, "");
      const headers = env.GITLAB_TOKEN ? { "private-token": env.GITLAB_TOKEN } : {};
      const r = await fetch(`https://${host}/api/v4/users/${encodeURIComponent(s.user)}/projects?visibility=public&per_page=100&order_by=last_activity_at`, { headers });
      if (!r.ok) throw new Error(`GitLab ${r.status}`);
      list = (await r.json()).map((x) => ({
        id: `gl:${host}:${x.id}`, provider: "gitlab", name: x.name, description: x.description || "",
        url: x.web_url, clone: x.http_url_to_repo, language: "", stars: x.star_count || 0,
        topics: x.topics || x.tag_list || [], updated: x.last_activity_at, fork: !!x.forked_from_project, archived: !!x.archived,
      }));
    }
  } catch (e) {
    return [];
  }
  await cache.put(key, new Response(JSON.stringify(list), { headers: { "cache-control": "max-age=1800" } }));
  return list;
}

async function loadRepos(env, cfg, refresh) {
  const all = (await Promise.all(cfg.sources.map((s) => fetchSource(s, env, refresh)))).flat();
  return all
    .map((r) => {
      const o = cfg.overrides[r.id] || {};
      return {
        ...r,
        original: { name: r.name, description: r.description },
        name: o.name || r.name,
        description: o.description || r.description,
        module: o.module || "",
        order: Number.isFinite(o.order) ? o.order : 999,
        hidden: o.hidden ?? r.fork,
      };
    })
    .sort((a, b) => a.order - b.order || String(b.updated).localeCompare(String(a.updated)));
}

function authorized(req, env) {
  const t = (req.headers.get("authorization") || "").replace(/^Bearer /, "");
  const k = env.ADMIN_TOKEN || "";
  if (!k || t.length !== k.length) return false;
  let d = 0;
  for (let i = 0; i < k.length; i++) d |= t.charCodeAt(i) ^ k.charCodeAt(i);
  return d === 0;
}

const str = (v, n) => String(v ?? "").slice(0, n);

function sanitize(b) {
  const overrides = {};
  for (const [id, o] of Object.entries(b.overrides || {}).slice(0, 500)) {
    overrides[str(id, 120)] = {
      ...(o.name && { name: str(o.name, 120) }),
      ...(o.description && { description: str(o.description, 600) }),
      ...(o.module && { module: str(o.module, 60) }),
      ...(Number.isFinite(o.order) && { order: o.order }),
      ...(typeof o.hidden === "boolean" && { hidden: o.hidden }),
    };
  }
  return {
    site: { title: str(b.site?.title, 120), subtitle: str(b.site?.subtitle, 300) },
    sources: (b.sources || []).slice(0, 10).filter((s) => s.user).map((s) => ({
      type: s.type === "gitlab" ? "gitlab" : "github", user: str(s.user, 80), host: str(s.host, 120),
    })),
    modules: (b.modules || []).slice(0, 50).map((m) => ({ id: str(m.id, 60), name: str(m.name, 120), description: str(m.description, 300) })),
    overrides,
  };
}

export default {
  async fetch(req, env) {
    const { pathname, searchParams } = new URL(req.url);

    if (pathname === "/api/repos") {
      const cfg = await getConfig(env);
      const repos = (await loadRepos(env, cfg, false)).filter((r) => !r.hidden && !r.archived);
      return json({ site: cfg.site, modules: cfg.modules, repos });
    }

    if (pathname.startsWith("/api/admin/")) {
      if (!authorized(req, env)) return json({ error: "No autorizado" }, 401);
      if (pathname === "/api/admin/data" && req.method === "GET") {
        const cfg = await getConfig(env);
        return json({ config: cfg, repos: await loadRepos(env, cfg, searchParams.has("refresh")) });
      }
      if (pathname === "/api/admin/config" && req.method === "PUT") {
        await env.KV.put("config", JSON.stringify(sanitize(await req.json())));
        return json({ ok: true });
      }
    }
    return json({ error: "No encontrado" }, 404);
  },
};

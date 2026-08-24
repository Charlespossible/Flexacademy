import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FC,
  type ReactNode,
  type KeyboardEvent,
  type ChangeEvent,
  type FormEvent,
} from "react";
import ReactMarkdown from "react-markdown";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES  (mirrors backend src/types/index.ts)
// ─────────────────────────────────────────────────────────────────────────────

type Role = "STUDENT" | "TUTOR" | "ADMIN" | "SUPER_ADMIN";
type SubscriptionTier = "FREE" | "BASIC" | "PRO" | "ELITE";

interface AuthUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  isActive: boolean;
  isEmailVerified: boolean;
}

interface Subscription {
  tier: SubscriptionTier;
  status: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface LoginResponse {
  user: AuthUser;
  subscription: Subscription | null;
  accessToken: string;
  refreshToken: string;
}

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  curriculum?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface QuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface GeneratedQuestion {
  body: string;
  options: QuestionOption[];
  explanation: string;
  difficulty: string;
}

interface AiSession {
  id: string;
  subject: string | null;
  topic: string | null;
  tokensUsed: number;
  createdAt: string;
  updatedAt: string;
}

interface HealthData {
  ok: boolean;
  status?: string;
  service?: string;
  version?: string;
  timestamp?: string;
  environment?: string;
}

interface ApiError {
  status: number;
  message: string;
  errors?: { field: string; message: string }[];
}

interface RequestResult {
  status: number;
  ok: boolean;
  ms: number;
  data: unknown;
}

// ─────────────────────────────────────────────────────────────────────────────
// CONFIG & API CLIENT
// ─────────────────────────────────────────────────────────────────────────────

const API = "http://localhost:5000/api/v1";

const getToken = (): string | null => localStorage.getItem("accessToken");

const apiFetch = async <T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string>),
    },
  });
  const data = (await res.json()) as { success: boolean; message: string; data: T };
  if (!res.ok) {
    const err = data as unknown as ApiError;
    throw { status: res.status, message: err.message ?? "Request failed", errors: (err as unknown as { errors?: { field: string; message: string }[] }).errors };
  }
  return data.data;
};

// ─────────────────────────────────────────────────────────────────────────────
// GLOBAL STYLES
// ─────────────────────────────────────────────────────────────────────────────

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700;12..96,800&family=Martian+Mono:wght@300;400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#0c0e14;--bg2:#13161f;--bg3:#1b1f2e;--bg4:#232840;
  --border:#2a2f45;--border2:#363c58;
  --text:#e8eaf2;--text2:#9ba3c4;--text3:#5a6080;
  --accent:#6ee7b7;--accent2:#f59e0b;--accent3:#f87171;--accent4:#818cf8;
  --sans:'Bricolage Grotesque',sans-serif;
  --mono:'Martian Mono',monospace;
  --r:6px;--r2:12px;
  --shadow:0 4px 24px rgba(0,0,0,.4);
}
html{font-size:16px;-webkit-font-smoothing:antialiased}
body{font-family:var(--sans);background:var(--bg);color:var(--text);min-height:100vh}
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}

/* layout */
.shell{display:grid;grid-template-columns:220px 1fr;min-height:100vh}

/* sidebar */
.sidebar{background:var(--bg2);border-right:1px solid var(--border);display:flex;flex-direction:column;position:sticky;top:0;height:100vh;overflow-y:auto}
.sidebar-brand{padding:24px 20px 18px;border-bottom:1px solid var(--border)}
.brand-row{display:flex;align-items:center;gap:10px}
.brand-gem{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,var(--accent),var(--accent4));display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.brand-name{font-size:16px;font-weight:800;letter-spacing:-.4px;color:var(--text)}
.brand-sub{font-family:var(--mono);font-size:9px;color:var(--text3);letter-spacing:2px;text-transform:uppercase;margin-top:1px}
.sidebar-nav{flex:1;padding:14px 10px}
.nav-grp{margin-bottom:20px}
.nav-grp-label{font-family:var(--mono);font-size:8.5px;letter-spacing:2px;text-transform:uppercase;color:var(--text3);padding:0 10px;margin-bottom:4px}
.nav-btn{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:var(--r2);font-size:13px;font-weight:500;color:var(--text2);cursor:pointer;border:none;background:none;width:100%;text-align:left;transition:all .15s;font-family:var(--sans)}
.nav-btn:hover{background:var(--bg3);color:var(--text)}
.nav-btn.active{background:rgba(110,231,183,.08);color:var(--accent)}
.nav-icon{font-size:15px;flex-shrink:0;width:20px;text-align:center}
.nav-badge{margin-left:auto;background:var(--accent);color:var(--bg);font-size:8.5px;font-family:var(--mono);padding:2px 6px;border-radius:20px;font-weight:700}
.sidebar-foot{padding:12px 10px;border-top:1px solid var(--border)}
.user-chip{display:flex;align-items:center;gap:9px;padding:9px 10px;border-radius:var(--r2);background:var(--bg3)}
.user-av{width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--accent2),var(--accent3));display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;color:white;flex-shrink:0}
.user-name{font-size:12.5px;font-weight:600;color:var(--text)}
.user-role{font-family:var(--mono);font-size:9px;color:var(--text3);text-transform:uppercase;letter-spacing:.8px}
.logout-btn{margin-left:auto;background:none;border:none;color:var(--text3);cursor:pointer;font-size:15px;transition:color .15s;padding:2px}
.logout-btn:hover{color:var(--accent3)}

/* topbar */
.topbar{background:var(--bg2);border-bottom:1px solid var(--border);height:56px;padding:0 28px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:40}
.topbar-title{font-size:14.5px;font-weight:700;letter-spacing:-.2px}
.topbar-right{display:flex;align-items:center;gap:10px}
.health-pill{display:flex;align-items:center;gap:6px;font-family:var(--mono);font-size:10.5px;padding:5px 10px;border-radius:20px;background:var(--bg3);border:1px solid var(--border);cursor:pointer;transition:border-color .15s;color:var(--text2)}
.health-pill:hover{border-color:var(--border2)}
.hdot{width:7px;height:7px;border-radius:50%}
.hdot.on{background:var(--accent);box-shadow:0 0 0 3px rgba(110,231,183,.15);animation:hpulse 2s infinite}
.hdot.off{background:var(--accent3)}
.hdot.chk{background:var(--accent2);animation:blink 1s infinite}
@keyframes hpulse{0%,100%{box-shadow:0 0 0 3px rgba(110,231,183,.15)}50%{box-shadow:0 0 0 6px rgba(110,231,183,.05)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}

/* content */
.main{display:flex;flex-direction:column;overflow:hidden;background:var(--bg)}
.content{flex:1;padding:28px;overflow-y:auto}

/* cards */
.card{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:22px}
.card-hd{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}
.card-title{font-size:13.5px;font-weight:700;color:var(--text)}
.card-sub{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:2px}

/* stats */
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-bottom:22px}
.stat{background:var(--bg2);border:1px solid var(--border);border-radius:var(--r2);padding:18px;position:relative;overflow:hidden}
.stat::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px}
.stat.s1::after{background:var(--accent)}
.stat.s2::after{background:var(--accent2)}
.stat.s3::after{background:var(--accent4)}
.stat.s4::after{background:var(--accent3)}
.stat-lbl{font-family:var(--mono);font-size:9px;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:8px}
.stat-val{font-size:24px;font-weight:800;letter-spacing:-1px;line-height:1}
.stat-desc{font-size:11px;color:var(--text3);margin-top:5px}

/* forms */
.fg{margin-bottom:14px}
.flabel{display:block;font-family:var(--mono);font-size:10px;letter-spacing:.5px;text-transform:uppercase;color:var(--text3);margin-bottom:5px}
.finput{width:100%;padding:9px 13px;background:var(--bg3);border:1.5px solid var(--border);border-radius:var(--r);font-family:var(--sans);font-size:13.5px;color:var(--text);outline:none;transition:border-color .15s}
.finput:focus{border-color:var(--accent);background:var(--bg4)}
.fselect{appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath fill='%235a6080' d='M5 7L0 2h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:30px;cursor:pointer}
.ferr{font-family:var(--mono);font-size:10px;color:var(--accent3);margin-top:3px}
.fhint{font-family:var(--mono);font-size:10px;color:var(--text3);margin-top:3px}

/* buttons */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 18px;border-radius:var(--r);font-family:var(--sans);font-size:13px;font-weight:600;cursor:pointer;border:none;transition:all .15s;white-space:nowrap}
.btn-primary{background:var(--accent);color:var(--bg)}
.btn-primary:hover{filter:brightness(1.1);transform:translateY(-1px);box-shadow:0 4px 14px rgba(110,231,183,.25)}
.btn-ghost{background:none;color:var(--text2);border:1.5px solid var(--border)}
.btn-ghost:hover{border-color:var(--accent);color:var(--accent)}
.btn-danger{background:rgba(248,113,113,.1);color:var(--accent3);border:1.5px solid rgba(248,113,113,.2)}
.btn-danger:hover{background:var(--accent3);color:white}
.btn-sm{padding:5px 11px;font-size:11.5px}
.btn-full{width:100%}
.btn:disabled{opacity:.4;cursor:not-allowed;transform:none!important;box-shadow:none!important;filter:none!important}
.btn-spin{position:relative;color:transparent!important}
.btn-spin::after{content:'';position:absolute;inset:0;margin:auto;width:14px;height:14px;border:2px solid currentColor;border-color:var(--bg) transparent var(--bg) transparent;border-radius:50%;animation:spin .6s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}

/* badges */
.badge{display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-family:var(--mono);font-size:9.5px;font-weight:500;letter-spacing:.5px;text-transform:uppercase}
.badge-green{background:rgba(110,231,183,.1);color:var(--accent);border:1px solid rgba(110,231,183,.2)}
.badge-amber{background:rgba(245,158,11,.1);color:var(--accent2);border:1px solid rgba(245,158,11,.2)}
.badge-red{background:rgba(248,113,113,.1);color:var(--accent3);border:1px solid rgba(248,113,113,.2)}
.badge-indigo{background:rgba(129,140,248,.1);color:var(--accent4);border:1px solid rgba(129,140,248,.2)}
.badge-muted{background:var(--bg3);color:var(--text3);border:1px solid var(--border)}

/* alert */
.alert{padding:10px 14px;border-radius:var(--r);font-size:12.5px;display:flex;align-items:flex-start;gap:8px;margin-bottom:14px}
.alert-err{background:rgba(248,113,113,.08);border:1px solid rgba(248,113,113,.2);color:#fca5a5}
.alert-ok{background:rgba(110,231,183,.08);border:1px solid rgba(110,231,183,.2);color:var(--accent)}
.alert-info{background:rgba(129,140,248,.08);border:1px solid rgba(129,140,248,.2);color:var(--accent4)}
.alert-warn{background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);color:var(--accent2)}

/* tabs */
.tabs{display:flex;gap:2px;border-bottom:1px solid var(--border);margin-bottom:22px}
.tab{padding:9px 14px;font-size:12.5px;font-weight:600;color:var(--text3);cursor:pointer;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s;font-family:var(--sans)}
.tab:hover{color:var(--text2)}
.tab.active{color:var(--accent);border-bottom-color:var(--accent)}

/* table */
.tbl-wrap{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:12.5px}
thead{border-bottom:1.5px solid var(--border)}
th{padding:9px 13px;text-align:left;font-family:var(--mono);font-size:9px;letter-spacing:1px;text-transform:uppercase;color:var(--text3);font-weight:500}
td{padding:11px 13px;border-bottom:1px solid var(--border);color:var(--text2)}
tr:last-child td{border-bottom:none}
tr:hover td{background:var(--bg3)}

/* divider */
.divider{height:1px;background:var(--border);margin:18px 0}

/* layout helpers */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px}
.row{display:flex;align-items:center;gap:10px}
.between{display:flex;align-items:center;justify-content:space-between}
.mt4{margin-top:4px}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mt20{margin-top:20px}
.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}
.mono{font-family:var(--mono)}
.dim{color:var(--text3)}
.sm{font-size:11.5px}
.xs{font-size:10.5px}
.bold{font-weight:700}

/* json viewer */
.json-panel{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:16px;font-family:var(--mono);font-size:11.5px;color:#8899cc;line-height:1.75;max-height:280px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
.jk{color:#7ecfe3}.js{color:#a8d8a0}.jn{color:#fbbf24}.jb{color:#c084fc}

/* endpoint pill */
.ep-row{display:flex;align-items:center;gap:9px;padding:9px 13px;border-radius:var(--r);border:1px solid var(--border);margin-bottom:7px;cursor:default;transition:border-color .15s}
.ep-row:hover{border-color:var(--border2)}
.ep-method{font-family:var(--mono);font-size:9.5px;font-weight:700;padding:2px 6px;border-radius:3px;min-width:40px;text-align:center}
.ep-method.GET{background:rgba(110,231,183,.12);color:var(--accent)}
.ep-method.POST{background:rgba(129,140,248,.12);color:var(--accent4)}
.ep-method.PATCH{background:rgba(245,158,11,.12);color:var(--accent2)}
.ep-method.DELETE{background:rgba(248,113,113,.12);color:var(--accent3)}
.ep-path{font-family:var(--mono);font-size:11px;color:var(--text2)}
.ep-desc{font-size:11.5px;color:var(--text3);margin-left:auto}

/* chat */
.chat-shell{display:flex;flex-direction:column;height:460px;border:1px solid var(--border);border-radius:var(--r2);overflow:hidden}
.chat-hd{padding:14px 18px;border-bottom:1px solid var(--border);background:var(--bg2);display:flex;align-items:center;gap:10px}
.chat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;background:var(--bg)}
.cmsg{max-width:78%;display:flex;flex-direction:column;gap:3px}
.cmsg.user{align-self:flex-end}
.cmsg.assistant{align-self:flex-start}
.cbubble{padding:10px 14px;border-radius:12px;font-size:13px;line-height:1.65}
.cmsg.user .cbubble{background:var(--accent);color:var(--bg);border-radius:12px 12px 3px 12px}
.cmsg.assistant .cbubble{background:var(--bg2);border:1px solid var(--border);border-radius:12px 12px 12px 3px;color:var(--text)}
.cmsg.assistant .cbubble p{margin-bottom:8px}
.cmsg.assistant .cbubble p:last-child{margin-bottom:0}
.cmsg.assistant .cbubble code{font-family:var(--mono);font-size:11px;background:var(--bg3);padding:2px 5px;border-radius:3px}
.cmsg.assistant .cbubble pre{background:var(--bg);border:1px solid var(--border);border-radius:var(--r);padding:10px;overflow-x:auto;font-size:11px;margin:8px 0}
.ctime{font-family:var(--mono);font-size:9.5px;color:var(--text3)}
.cmsg.user .ctime{text-align:right}
.chat-ft{padding:12px;border-top:1px solid var(--border);background:var(--bg2);display:flex;gap:8px}
.chat-in{flex:1;background:var(--bg3);border:1.5px solid var(--border);border-radius:var(--r);padding:8px 13px;font-family:var(--sans);font-size:13px;color:var(--text);outline:none;resize:none;height:38px;transition:border-color .15s}
.chat-in:focus{border-color:var(--accent)}
.typing{display:flex;gap:4px;align-items:center;padding:12px 14px}
.tdot{width:6px;height:6px;border-radius:50%;background:var(--text3);animation:tdot 1.1s infinite}
.tdot:nth-child(2){animation-delay:.2s}
.tdot:nth-child(3){animation-delay:.4s}
@keyframes tdot{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}

/* questions */
.qcard{background:var(--bg);border:1px solid var(--border);border-radius:var(--r2);padding:18px;margin-bottom:10px;transition:border-color .15s}
.qcard:hover{border-color:var(--border2)}
.qbody{font-size:13.5px;font-weight:600;line-height:1.55;margin-bottom:12px;color:var(--text)}
.opts{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.opt{padding:8px 11px;border-radius:var(--r);border:1.5px solid var(--border);font-size:12.5px;display:flex;align-items:center;gap:7px;transition:all .15s;background:var(--bg2);color:var(--text2)}
.opt.correct{border-color:var(--accent);background:rgba(110,231,183,.06);color:var(--accent)}
.opt-id{font-family:var(--mono);font-size:10px;font-weight:700;width:18px;flex-shrink:0}
.expl{margin-top:10px;padding:10px 13px;background:rgba(110,231,183,.05);border-left:3px solid var(--accent);border-radius:0 var(--r) var(--r) 0;font-size:12px;color:var(--text2);line-height:1.65}

/* skeleton */
.skel{background:linear-gradient(90deg,var(--bg3) 25%,var(--bg4) 50%,var(--bg3) 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:var(--r)}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

/* auth page */
.auth-page{min-height:100vh;display:flex;background:var(--bg)}
.auth-panel{width:42%;background:var(--bg2);border-right:1px solid var(--border);padding:52px;display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden}
.auth-panel::before{content:'';position:absolute;top:-120px;right:-120px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,rgba(110,231,183,.07) 0%,transparent 70%);pointer-events:none}
.auth-panel::after{content:'';position:absolute;bottom:-80px;left:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(129,140,248,.06) 0%,transparent 70%);pointer-events:none}
.auth-headline{font-size:36px;font-weight:800;line-height:1.12;letter-spacing:-1.2px;color:var(--text);margin-top:44px;position:relative;z-index:1}
.auth-headline em{font-style:normal;color:var(--accent)}
.auth-feats{display:flex;flex-direction:column;gap:14px;position:relative;z-index:1}
.auth-feat{display:flex;align-items:center;gap:11px;color:var(--text2);font-size:13px}
.af-icon{width:30px;height:30px;border-radius:8px;background:var(--bg3);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.auth-form-wrap{flex:1;background:var(--bg);display:flex;align-items:center;justify-content:center;padding:40px}
.auth-box{width:100%;max-width:390px}
.auth-title{font-size:24px;font-weight:800;letter-spacing:-.6px;margin-bottom:3px}
.auth-sub{font-size:13px;color:var(--text3);margin-bottom:28px}
.auth-switch{font-size:12.5px;color:var(--text3);margin-top:18px;text-align:center}
.auth-switch button{background:none;border:none;color:var(--accent);font-weight:700;cursor:pointer;font-family:var(--sans);font-size:12.5px}
.auth-demo{background:none;border:1.5px dashed var(--border2);color:var(--text3);font-size:12px;padding:8px;border-radius:var(--r);cursor:pointer;width:100%;font-family:var(--sans);transition:all .15s;margin-top:8px}
.auth-demo:hover{border-color:var(--accent4);color:var(--accent4)}

/* fade in */
.fi{animation:fi .25s ease}
@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
`;

// ─────────────────────────────────────────────────────────────────────────────
// SMALL REUSABLE COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const Alert: FC<{ type?: "err" | "ok" | "info" | "warn"; children: ReactNode }> = ({
  type = "err",
  children,
}) => (
  <div className={`alert alert-${type}`}>
    <span>{type === "err" ? "⚠" : type === "ok" ? "✓" : type === "warn" ? "!" : "ℹ"}</span>
    <span>{children}</span>
  </div>
);

const Skeleton: FC<{ h?: number; w?: string; mb?: number }> = ({
  h = 14,
  w = "100%",
  mb = 8,
}) => <div className="skel" style={{ height: h, width: w, marginBottom: mb }} />;

const JsonViewer: FC<{ data: unknown }> = ({ data }) => {
  const html = JSON.stringify(data, null, 2)
    .replace(/("([^"]+)":)/g, '<span class="jk">$1</span>')
    .replace(/: "([^"]+)"/g, ': <span class="js">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span class="jn">$1</span>')
    .replace(/: (true|false)/g, ': <span class="jb">$1</span>');
  return (
    <div
      className="json-panel"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

const Badge: FC<{
  variant?: "green" | "amber" | "red" | "indigo" | "muted";
  children: ReactNode;
}> = ({ variant = "muted", children }) => (
  <span className={`badge badge-${variant}`}>{children}</span>
);

// ─────────────────────────────────────────────────────────────────────────────
// HOOKS
// ─────────────────────────────────────────────────────────────────────────────

const useHealth = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("http://localhost:5000/health");
      const data = (await res.json()) as HealthData;
      setHealth({ ...data, ok: true });
    } catch {
      setHealth({ ok: false, status: "OFFLINE" });
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
    const t = setInterval(() => void check(), 15_000);
    return () => clearInterval(t);
  }, [check]);

  return { health, checking, refresh: check };
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PAGE
// ─────────────────────────────────────────────────────────────────────────────

interface AuthPageProps {
  onAuth: (user: AuthUser) => void;
}

const AuthPage: FC<AuthPageProps> = ({ onAuth }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState<RegisterPayload & { password: string }>({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    gradeLevel: "SS3",
    curriculum: "WAEC",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set =
    (k: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((p) => ({ ...p, [k]: e.target.value }));
      setError(null);
    };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "login") {
        const data = await apiFetch<LoginResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        onAuth(data.user);
      } else {
        const data = await apiFetch<LoginResponse>("/auth/register", {
          method: "POST",
          body: JSON.stringify(form),
        });
        localStorage.setItem("accessToken", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        onAuth(data.user);
      }
    } catch (err) {
      setError((err as ApiError).message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div>
          <div className="brand-row">
            <div className="brand-gem">🎓</div>
            <div>
              <div className="brand-name">FlexAcademy</div>
              <div className="brand-sub">Dev Console</div>
            </div>
          </div>
          <div className="auth-headline">
            Learn smarter.<br />
            Ace every<br />
            <em>exam.</em>
          </div>
        </div>
        <div className="auth-feats">
          {(
            [
              ["🤖", "FlexBot AI — 24/7 exam tutor"],
              ["📚", "WAEC · JAMB · NECO · IGCSE"],
              ["🏆", "Gamified streaks & leaderboards"],
              ["📊", "AI performance analytics"],
            ] as [string, string][]
          ).map(([icon, label]) => (
            <div className="auth-feat" key={label}>
              <div className="af-icon">{icon}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-wrap">
        <div className="auth-box fi">
          <div className="auth-title">
            {mode === "login" ? "Welcome back" : "Create account"}
          </div>
          <div className="auth-sub">
            {mode === "login"
              ? "Sign in to the FlexAcademy dev console"
              : "Register a new student account"}
          </div>

          {error && <Alert type="err">{error}</Alert>}

          <form onSubmit={(e) => void submit(e)}>
            {mode === "register" && (
              <div className="g2">
                <div className="fg">
                  <label className="flabel">First Name</label>
                  <input
                    className="finput"
                    value={form.firstName}
                    onChange={set("firstName")}
                    placeholder="Chidi"
                    required
                  />
                </div>
                <div className="fg">
                  <label className="flabel">Last Name</label>
                  <input
                    className="finput"
                    value={form.lastName}
                    onChange={set("lastName")}
                    placeholder="Okafor"
                    required
                  />
                </div>
              </div>
            )}
            <div className="fg">
              <label className="flabel">Email</label>
              <input
                className="finput"
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="student@example.com"
                required
              />
            </div>
            <div className="fg">
              <label className="flabel">Password</label>
              <input
                className="finput"
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder={
                  mode === "register"
                    ? "Min 8 chars, 1 uppercase + 1 number"
                    : "••••••••"
                }
                required
              />
            </div>
            {mode === "register" && (
              <div className="g2">
                <div className="fg">
                  <label className="flabel">Grade</label>
                  <select
                    className="finput fselect"
                    value={form.gradeLevel}
                    onChange={set("gradeLevel")}
                  >
                    {["JSS1", "JSS2", "JSS3", "SS1", "SS2", "SS3"].map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div className="fg">
                  <label className="flabel">Curriculum</label>
                  <select
                    className="finput fselect"
                    value={form.curriculum}
                    onChange={set("curriculum")}
                  >
                    {["WAEC", "JAMB", "NECO", "IGCSE"].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              className={`btn btn-primary btn-full mt12 ${loading ? "btn-spin" : ""}`}
              disabled={loading}
            >
              {!loading && (mode === "login" ? "Sign In →" : "Create Account →")}
            </button>
          </form>

          {mode === "login" && (
            <button
              className="auth-demo"
              onClick={() =>
                setForm((p) => ({
                  ...p,
                  email: "demo@flexacademy.com",
                  password: "Student@1234",
                }))
              }
            >
              🧪 Fill demo credentials (demo@flexacademy.com)
            </button>
          )}

          <div className="auth-switch">
            {mode === "login"
              ? "New to FlexAcademy? "
              : "Already have an account? "}
            <button
              onClick={() => {
                setMode((m) => (m === "login" ? "register" : "login"));
                setError(null);
              }}
            >
              {mode === "login" ? "Create account" : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

interface DashboardPageProps {
  user: AuthUser;
  health: HealthData | null;
}

const DashboardPage: FC<DashboardPageProps> = ({ user, health }) => {
  const [pingResult, setPingResult] = useState<unknown>(null);
  const [pinging, setPinging] = useState(false);

  const ping = async () => {
    setPinging(true);
    try {
      const res = await fetch("http://localhost:5000/health");
      const data = (await res.json()) as unknown;
      setPingResult(data);
    } catch (e) {
      setPingResult({ error: (e as Error).message });
    } finally {
      setPinging(false);
    }
  };

  const ENDPOINTS: { method: string; path: string; desc: string }[] = [
    { method: "POST", path: "/api/v1/auth/register", desc: "Register user + create profile" },
    { method: "POST", path: "/api/v1/auth/login", desc: "Login → JWT pair" },
    { method: "POST", path: "/api/v1/auth/refresh", desc: "Rotate refresh token" },
    { method: "POST", path: "/api/v1/auth/logout", desc: "Clear server refresh hash" },
    { method: "GET",  path: "/api/v1/auth/verify-email/:token", desc: "Redis token → email verified" },
    { method: "POST", path: "/api/v1/auth/forgot-password", desc: "Queue reset email" },
    { method: "POST", path: "/api/v1/auth/reset-password", desc: "Hash new password" },
    { method: "POST", path: "/api/v1/ai-tutor/chat", desc: "FlexBot SSE stream" },
    { method: "POST", path: "/api/v1/ai-tutor/generate-questions", desc: "AI question gen" },
    { method: "GET",  path: "/api/v1/ai-tutor/analyze", desc: "AI performance analysis" },
    { method: "GET",  path: "/api/v1/ai-tutor/sessions", desc: "List AI sessions (paginated)" },
    { method: "GET",  path: "/api/v1/subjects", desc: "List subjects" },
    { method: "GET",  path: "/api/v1/leaderboard", desc: "Rankings" },
  ];

  return (
    <div className="fi">
      <div className="stats">
        {(
          [
            ["s1", "Server Status", health?.ok ? "ONLINE" : "OFFLINE", `Port 5000 · ${health?.environment ?? "—"}`],
            ["s2", "Logged In As", `${user.firstName} ${user.lastName}`, user.role],
            ["s3", "API Version", health?.version ?? "v1", "REST · JWT · SSE"],
            ["s4", "Phase 1 Routes", `${ENDPOINTS.length}`, "implemented"],
          ] as [string, string, string, string][]
        ).map(([cls, lbl, val, desc]) => (
          <div className={`stat ${cls}`} key={lbl}>
            <div className="stat-lbl">{lbl}</div>
            <div
              className="stat-val"
              style={
                lbl === "Server Status"
                  ? { fontSize: 18, color: health?.ok ? "var(--accent)" : "var(--accent3)" }
                  : lbl === "Logged In As"
                  ? { fontSize: 15, paddingTop: 4 }
                  : {}
              }
            >
              {val}
            </div>
            <div className="stat-desc">{desc}</div>
          </div>
        ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Health Check</div>
              <div className="card-sub">GET /health</div>
            </div>
            <button
              className={`btn btn-primary btn-sm ${pinging ? "btn-spin" : ""}`}
              onClick={() => void ping()}
              disabled={pinging}
            >
              {!pinging && "▶ Run"}
            </button>
          </div>
          {pingResult ? (
            <JsonViewer data={pingResult} />
          ) : (
            <div
              style={{
                textAlign: "center",
                padding: "32px 0",
                color: "var(--text3)",
                fontSize: 12.5,
              }}
            >
              Click Run to ping the server
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Active Session</div>
              <div className="card-sub">Decoded JWT payload</div>
            </div>
            <Badge variant="green">ACTIVE</Badge>
          </div>
          <JsonViewer
            data={{
              user: {
                id: user.id,
                email: user.email,
                role: user.role,
                firstName: user.firstName,
                lastName: user.lastName,
              },
              tokenPresent: !!getToken(),
              tokenPreview: getToken()?.slice(0, 32) + "…",
            }}
          />
        </div>
      </div>

      <div className="card mt20">
        <div className="card-hd">
          <div>
            <div className="card-title">API Route Map — Phase 1</div>
            <div className="card-sub">All implemented endpoints</div>
          </div>
          <Badge variant="amber">{ENDPOINTS.length} routes</Badge>
        </div>
        {ENDPOINTS.map((ep) => (
          <div className="ep-row" key={ep.path}>
            <span className={`ep-method ${ep.method}`}>{ep.method}</span>
            <span className="ep-path">{ep.path}</span>
            <span className="ep-desc">{ep.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AUTH TESTER PAGE
// ─────────────────────────────────────────────────────────────────────────────

const AuthTesterPage: FC = () => {
  type AuthTab = "login" | "register" | "refresh" | "logout" | "forgot";
  const [tab, setTab] = useState<AuthTab>("login");
  const [form, setForm] = useState({
    email: "demo@flexacademy.com",
    password: "Student@1234",
    firstName: "",
    lastName: "",
    gradeLevel: "SS3",
    curriculum: "WAEC",
  });
  const [result, setResult] = useState<RequestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  const run = async (path: string, body: unknown) => {
    setLoading(true);
    setResult(null);
    const t = Date.now();
    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as unknown;
      setResult({ status: res.status, ok: res.ok, ms: Date.now() - t, data });
      if (
        (data as { data?: { accessToken?: string } }).data?.accessToken
      ) {
        localStorage.setItem(
          "accessToken",
          (data as { data: { accessToken: string } }).data.accessToken
        );
        localStorage.setItem(
          "refreshToken",
          (data as { data: { refreshToken: string } }).data.refreshToken
        );
      }
    } catch (e) {
      setResult({ status: 0, ok: false, ms: Date.now() - t, data: { error: (e as Error).message } });
    } finally {
      setLoading(false);
    }
  };

  const handlers: Record<AuthTab, () => Promise<void>> = {
    login: () => run("/auth/login", { email: form.email, password: form.password }),
    register: () => run("/auth/register", form),
    refresh: () => run("/auth/refresh", { refreshToken: localStorage.getItem("refreshToken") }),
    logout: () => run("/auth/logout", {}),
    forgot: () => run("/auth/forgot-password", { email: form.email }),
  };

  const tabs: AuthTab[] = ["login", "register", "refresh", "logout", "forgot"];

  return (
    <div className="fi">
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => { setTab(t); setResult(null); }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Request Payload</div>
              <div className="card-sub">POST /api/v1/auth/{tab}</div>
            </div>
            <Badge variant="indigo">POST</Badge>
          </div>

          {(tab === "login" || tab === "register" || tab === "forgot") && (
            <div className="fg">
              <label className="flabel">Email</label>
              <input className="finput" value={form.email} onChange={set("email")} />
            </div>
          )}
          {(tab === "login" || tab === "register") && (
            <div className="fg">
              <label className="flabel">Password</label>
              <input className="finput" type="password" value={form.password} onChange={set("password")} />
            </div>
          )}
          {tab === "register" && (
            <>
              <div className="g2">
                <div className="fg">
                  <label className="flabel">First Name</label>
                  <input className="finput" value={form.firstName} onChange={set("firstName")} placeholder="Chidi" />
                </div>
                <div className="fg">
                  <label className="flabel">Last Name</label>
                  <input className="finput" value={form.lastName} onChange={set("lastName")} placeholder="Okafor" />
                </div>
              </div>
              <div className="g2">
                <div className="fg">
                  <label className="flabel">Grade</label>
                  <select className="finput fselect" value={form.gradeLevel} onChange={set("gradeLevel")}>
                    {["JSS1","JSS2","JSS3","SS1","SS2","SS3"].map((g) => <option key={g}>{g}</option>)}
                  </select>
                </div>
                <div className="fg">
                  <label className="flabel">Curriculum</label>
                  <select className="finput fselect" value={form.curriculum} onChange={set("curriculum")}>
                    {["WAEC","JAMB","NECO","IGCSE"].map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </>
          )}
          {tab === "refresh" && (
            <div className="fg">
              <label className="flabel">Refresh Token (auto-loaded)</label>
              <input
                className="finput mono xs"
                value={(localStorage.getItem("refreshToken") ?? "").slice(0, 44) + "…"}
                readOnly
              />
              <div className="fhint">Read from localStorage automatically</div>
            </div>
          )}
          {tab === "logout" && (
            <Alert type="info">
              Sends POST /auth/logout with current Bearer token. Clears
              refreshTokenHash on the server.
            </Alert>
          )}

          <button
            className={`btn btn-primary btn-full mt8 ${loading ? "btn-spin" : ""}`}
            onClick={() => void handlers[tab]()}
            disabled={loading}
          >
            {!loading && "Send Request →"}
          </button>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Server Response</div>
              <div className="card-sub">{result ? "Live result from backend" : "Awaiting request…"}</div>
            </div>
            {result && (
              <div className="row">
                <Badge variant={result.ok ? "green" : "red"}>{result.status}</Badge>
                <span className="xs mono dim">{result.ms}ms</span>
              </div>
            )}
          </div>
          {loading && (
            <>
              <Skeleton h={13} mb={8} />
              <Skeleton h={13} w="75%" mb={8} />
              <Skeleton h={13} w="55%" />
            </>
          )}
          {result && <JsonViewer data={result.data} />}
          {!result && !loading && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 12.5 }}>
              Response will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// AI TUTOR PAGE
// ─────────────────────────────────────────────────────────────────────────────

const AiTutorPage: FC = () => {
  type AiTab = "chat" | "questions" | "sessions";
  const [aiTab, setAiTab] = useState<AiTab>("chat");

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "👋 Hi! I'm **FlexBot**, your AI study companion. Ask me anything about WAEC, JAMB, Mathematics, Sciences or any subject you're studying!",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [subject, setSubject] = useState("Mathematics");
  const [topic, setTopic] = useState("Algebra");

  // Questions state
  const [examCat, setExamCat] = useState("WAEC");
  const [difficulty, setDifficulty] = useState("INTERMEDIATE");
  const [count, setCount] = useState(3);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  // Sessions state
  const [sessions, setSessions] = useState<AiSession[]>([]);

  const msgsEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    msgsEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendChat = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: ChatMessage = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages((p) => [...p, userMsg]);
    const sent = input;
    setInput("");
    setStreaming(true);

    let assistantContent = "";
    setMessages((p) => [
      ...p,
      { role: "assistant", content: "", timestamp: new Date().toISOString() },
    ]);

    try {
      const res = await fetch(`${API}/ai-tutor/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken() ?? ""}`,
        },
        body: JSON.stringify({ message: sent, sessionId, subject, topic }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder
          .decode(value)
          .split("\n")
          .filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const json = JSON.parse(line.slice(6)) as {
              type: string;
              content?: string;
              sessionId?: string;
            };
            if (json.type === "text" && json.content) {
              assistantContent += json.content;
              setMessages((p) => {
                const msgs = [...p];
                msgs[msgs.length - 1] = {
                  ...msgs[msgs.length - 1],
                  content: assistantContent,
                };
                return msgs;
              });
            }
            if (json.type === "done" && json.sessionId) {
              setSessionId(json.sessionId);
            }
          } catch {
            // partial chunk — ignore
          }
        }
      }
    } catch (e) {
      setMessages((p) => {
        const msgs = [...p];
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content: `⚠ Stream error: ${(e as Error).message}`,
        };
        return msgs;
      });
    } finally {
      setStreaming(false);
    }
  };

  const generateQuestions = async () => {
    setGenLoading(true);
    setGenError(null);
    setQuestions([]);
    try {
      const data = await apiFetch<{ questions: GeneratedQuestion[] }>(
        "/ai-tutor/generate-questions",
        {
          method: "POST",
          body: JSON.stringify({ subject, topic, examCategory: examCat, difficulty, count }),
        }
      );
      setQuestions(data.questions);
    } catch (e) {
      setGenError((e as ApiError).message);
    } finally {
      setGenLoading(false);
    }
  };

  const loadSessions = async () => {
    try {
      const data = await apiFetch<AiSession[]>("/ai-tutor/sessions");
      setSessions(data);
    } catch {
      // stay empty
    }
  };

  useEffect(() => {
    if (aiTab === "sessions") void loadSessions();
  }, [aiTab]);

  return (
    <div className="fi">
      <div className="tabs">
        {(["chat", "questions", "sessions"] as AiTab[]).map((t) => (
          <button
            key={t}
            className={`tab ${aiTab === t ? "active" : ""}`}
            onClick={() => setAiTab(t)}
          >
            {t === "chat" ? "💬 FlexBot Chat" : t === "questions" ? "📝 Question Generator" : "📋 Sessions"}
          </button>
        ))}
      </div>

      {aiTab === "chat" && (
        <div className="g2">
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="chat-shell" style={{ border: "none", borderRadius: 0 }}>
              <div className="chat-hd">
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg,var(--accent),var(--accent4))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    flexShrink: 0,
                  }}
                >
                  🤖
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>FlexBot</div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: 9.5, color: "var(--accent)" }}>
                    ● ONLINE · text/event-stream
                  </div>
                </div>
                {sessionId && (
                  <Badge variant="indigo" >
                    Session active
                  </Badge>
                )}
              </div>

              <div className="chat-body">
                {messages.map((m, i) => (
                  <div key={i} className={`cmsg ${m.role}`}>
                    <div className="cbubble">
                      {m.role === "assistant" ? (
                        m.content ? (
                          <ReactMarkdown>{m.content}</ReactMarkdown>
                        ) : streaming && i === messages.length - 1 ? (
                          <div className="typing">
                            <div className="tdot" />
                            <div className="tdot" />
                            <div className="tdot" />
                          </div>
                        ) : null
                      ) : (
                        m.content
                      )}
                    </div>
                    <div className="ctime">
                      {new Date(m.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
                <div ref={msgsEnd} />
              </div>

              <div className="chat-ft">
                <textarea
                  className="chat-in"
                  value={input}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void sendChat();
                    }
                  }}
                  placeholder="Ask FlexBot anything… (Enter to send)"
                  disabled={streaming}
                />
                <button
                  className={`btn btn-primary ${streaming ? "btn-spin" : ""}`}
                  onClick={() => void sendChat()}
                  disabled={streaming || !input.trim()}
                >
                  {!streaming && "→"}
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-title mb12">Chat Context</div>
            <div className="fg">
              <label className="flabel">Subject</label>
              <input
                className="finput"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="fg">
              <label className="flabel">Topic</label>
              <input
                className="finput"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="divider" />
            <div className="card-sub mb8">API Details</div>
            <div className="ep-row" style={{ marginBottom: 0 }}>
              <span className="ep-method POST">POST</span>
              <span className="ep-path">/ai-tutor/chat</span>
            </div>
            <div className="mt12 xs mono dim" style={{ lineHeight: 2 }}>
              • Requires Bearer token
              <br />
              • Content-Type: text/event-stream
              <br />
              • Format: data: {`{"type":"text","content":"…"}`}
              <br />
              • Session persisted in PostgreSQL
              {sessionId && (
                <>
                  <br />• ID: {sessionId.slice(0, 18)}…
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {aiTab === "questions" && (
        <div className="g2">
          <div className="card">
            <div className="card-hd">
              <div>
                <div className="card-title">Generate Questions</div>
                <div className="card-sub">POST /ai-tutor/generate-questions</div>
              </div>
              <Badge variant="indigo">POST</Badge>
            </div>
            {genError && <Alert type="err">{genError}</Alert>}
            <div className="g2">
              <div className="fg">
                <label className="flabel">Subject</label>
                <input className="finput" value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="fg">
                <label className="flabel">Topic</label>
                <input className="finput" value={topic} onChange={(e) => setTopic(e.target.value)} />
              </div>
            </div>
            <div className="g2">
              <div className="fg">
                <label className="flabel">Exam Category</label>
                <select className="finput fselect" value={examCat} onChange={(e) => setExamCat(e.target.value)}>
                  {["WAEC","JAMB","NECO","GCE","IGCSE","SAT","IELTS","CUSTOM"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="fg">
                <label className="flabel">Difficulty</label>
                <select className="finput fselect" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                  {["BEGINNER","INTERMEDIATE","ADVANCED","EXAM_READY"].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="fg">
              <label className="flabel">Count (1–20)</label>
              <input
                className="finput"
                type="number"
                min={1}
                max={20}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
              />
            </div>
            <button
              className={`btn btn-primary btn-full ${genLoading ? "btn-spin" : ""}`}
              onClick={() => void generateQuestions()}
              disabled={genLoading}
            >
              {!genLoading && "⚡ Generate Questions"}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 580, overflowY: "auto" }}>
            {genLoading &&
              [1, 2, 3].map((i) => (
                <div key={i} className="qcard">
                  <Skeleton h={15} mb={10} />
                  <Skeleton h={11} w="70%" mb={10} />
                  <div className="opts">
                    <Skeleton h={34} />
                    <Skeleton h={34} />
                    <Skeleton h={34} />
                    <Skeleton h={34} />
                  </div>
                </div>
              ))}
            {!genLoading && questions.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text3)", fontSize: 12.5 }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
                Configure and click Generate
              </div>
            )}
            {questions.map((q, i) => (
              <div key={i} className="qcard fi">
                <div className="between mb8">
                  <Badge variant="muted">Q{i + 1}</Badge>
                  <Badge
                    variant={
                      q.difficulty === "BEGINNER"
                        ? "green"
                        : q.difficulty === "ADVANCED" || q.difficulty === "EXAM_READY"
                        ? "red"
                        : "amber"
                    }
                  >
                    {q.difficulty}
                  </Badge>
                </div>
                <div className="qbody">{q.body}</div>
                <div className="opts">
                  {q.options.map((opt) => (
                    <div key={opt.id} className={`opt ${opt.isCorrect ? "correct" : ""}`}>
                      <span className="opt-id">{opt.id}</span>
                      <span>{opt.text}</span>
                    </div>
                  ))}
                </div>
                {q.explanation && (
                  <div className="expl">💡 {q.explanation}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {aiTab === "sessions" && (
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">AI Tutor Sessions</div>
              <div className="card-sub">GET /ai-tutor/sessions</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => void loadSessions()}>
              ↺ Refresh
            </button>
          </div>
          {sessions.length === 0 ? (
            <div style={{ textAlign: "center", padding: "36px 0", color: "var(--text3)", fontSize: 12.5 }}>
              No sessions yet. Start a FlexBot chat!
            </div>
          ) : (
            <div className="tbl-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Session ID</th>
                    <th>Subject</th>
                    <th>Topic</th>
                    <th>Tokens Used</th>
                    <th>Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id}>
                      <td className="mono">{s.id.slice(0, 8)}…</td>
                      <td>{s.subject ?? "—"}</td>
                      <td>{s.topic ?? "—"}</td>
                      <td className="mono">{s.tokensUsed}</td>
                      <td className="dim">{new Date(s.updatedAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATORS PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ValidatorsPage: FC = () => {
  type VTab = "register" | "login" | "generateQ";
  const [tab, setTab] = useState<VTab>("register");
  const DEFAULTS: Record<VTab, string> = {
    register: `{\n  "email": "bad-email",\n  "password": "weak",\n  "firstName": "",\n  "lastName": ""\n}`,
    login: `{\n  "email": "notanemail",\n  "password": ""\n}`,
    generateQ: `{\n  "subject": "",\n  "topic": ""\n}`,
  };
  const PATHS: Record<VTab, string> = {
    register: "/auth/register",
    login: "/auth/login",
    generateQ: "/ai-tutor/generate-questions",
  };
  const [payload, setPayload] = useState(DEFAULTS.register);
  const [result, setResult] = useState<RequestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setResult(null);
    const t = Date.now();
    try {
      const body = JSON.parse(payload) as unknown;
      const res = await fetch(`${API}${PATHS[tab]}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as unknown;
      setResult({ status: res.status, ok: res.ok, ms: Date.now() - t, data });
    } catch (e) {
      const msg =
        (e as Error).message === "Unexpected end of JSON input"
          ? "Invalid JSON — fix your payload"
          : (e as Error).message;
      setResult({ status: 0, ok: false, ms: Date.now() - t, data: { error: msg } });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fi">
      <Alert type="info">
        Send intentionally invalid payloads to see how the Zod validation layer responds.
      </Alert>
      <div className="tabs">
        {(["register", "login", "generateQ"] as VTab[]).map((t) => (
          <button
            key={t}
            className={`tab ${tab === t ? "active" : ""}`}
            onClick={() => {
              setTab(t);
              setPayload(DEFAULTS[t]);
              setResult(null);
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Request Body (JSON)</div>
              <div className="card-sub">POST /api/v1{PATHS[tab]}</div>
            </div>
            <Badge variant="indigo">POST</Badge>
          </div>
          <textarea
            className="finput"
            style={{ fontFamily: "var(--mono)", fontSize: 12, height: 180, resize: "vertical", lineHeight: 1.75 }}
            value={payload}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setPayload(e.target.value)}
          />
          <button
            className={`btn btn-primary btn-full mt8 ${loading ? "btn-spin" : ""}`}
            onClick={() => void run()}
            disabled={loading}
          >
            {!loading && "Send Bad Payload →"}
          </button>
        </div>

        <div className="card">
          <div className="card-hd">
            <div>
              <div className="card-title">Validation Errors</div>
              <div className="card-sub">Zod schema errors from backend</div>
            </div>
            {result && (
              <Badge variant={result.ok ? "green" : result.status === 422 ? "amber" : "red"}>
                {result.status || "ERR"}
              </Badge>
            )}
          </div>

          {result &&
            (result.data as { errors?: { field: string; message: string }[] }).errors?.map(
              (err, i) => (
                <div key={i} className="alert alert-err" style={{ marginBottom: 6 }}>
                  <strong className="mono">{err.field}:</strong> {err.message}
                </div>
              )
            )}

          {result && <JsonViewer data={result.data} />}

          {!result && (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text3)", fontSize: 12.5 }}>
              Send a request to see validation errors
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ROOT APP
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// PROGRESS & ANALYTICS PAGE
// ─────────────────────────────────────────────────────────────────────────────

type ProgressTab = "overview" | "topics" | "heatmap" | "readiness" | "comparisons";

const ProgressPage: FC = () => {
  const [tab, setTab] = useState<ProgressTab>("overview");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState<string>("");

  const fetchTab = async (t: ProgressTab) => {
    setTab(t);
    setLoading(true);
    setError("");
    setData(null);
    const paths: Record<ProgressTab, string> = {
      overview: "/progress/me",
      topics: "/progress/me/topics",
      heatmap: "/progress/me/heatmap",
      readiness: "/progress/me/exam-readiness",
      comparisons: "/progress/me/comparisons",
    };
    try {
      const res = await apiFetch(paths[t]);
      setData(res);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const tabs: ProgressTab[] = ["overview", "topics", "heatmap", "readiness", "comparisons"];
  const labels: Record<ProgressTab, string> = {
    overview: "📊 Overview",
    topics: "🧠 Topic Mastery",
    heatmap: "🗓 Activity Heatmap",
    readiness: "🎯 Exam Readiness",
    comparisons: "📈 Benchmarks",
  };

  return (
    <div className="fi">
      <div className="tabs">
        {tabs.map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => void fetchTab(t)}>
            {labels[t]}
          </button>
        ))}
      </div>

      <div className="g2" style={{ marginBottom: 14 }}>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">What This Shows</div><div className="card-sub">{tab.toUpperCase()} endpoint</div></div></div>
          <div style={{ fontSize: 12.5, color: "var(--text2)", lineHeight: 1.7 }}>
            {tab === "overview" && "Your overall learning progress — courses enrolled, completed, total XP earned, and streak status."}
            {tab === "topics" && "Per-topic accuracy scores used to identify your strong and weak areas. Drives the AI recommendation engine."}
            {tab === "heatmap" && "GitHub-style daily study activity heatmap. Each cell = one day, intensity = study minutes."}
            {tab === "readiness" && "AI-calculated readiness score for each of your target exams. E.g. 'WAEC 74% ready'."}
            {tab === "comparisons" && "Anonymised benchmark — how your accuracy in each subject compares to the national average."}
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Endpoint</div><div className="card-sub">GET /api/v1/progress/me/...</div></div></div>
          {[
            ["GET", "/progress/me", "Overview summary"],
            ["GET", "/progress/me/subjects", "Per-subject mastery"],
            ["GET", "/progress/me/topics", "Per-topic accuracy"],
            ["GET", "/progress/me/weak-areas", "Topics < 60% accuracy"],
            ["GET", "/progress/me/heatmap", "Heatmap data"],
            ["GET", "/progress/me/exam-readiness", "Exam readiness score"],
            ["GET", "/progress/me/comparisons", "National benchmark"],
            ["GET", "/progress/me/timeline", "Study activity over time"],
          ].map(([m, p, d]) => (
            <div key={p} className="ep-row" style={{ marginBottom: 5 }}>
              <span className={`ep-method ${m}`}>{m}</span>
              <span className="ep-path">{p}</span>
              <span className="ep-desc">{d}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-hd">
          <div><div className="card-title">Live Response</div><div className="card-sub">GET /api/v1{tab === "overview" ? "/progress/me" : `/progress/me/${tab}`}</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => void fetchTab(tab)} disabled={loading}>
            {loading ? "Loading…" : "▶ Fetch"}
          </button>
        </div>
        {error && <Alert type="err">{error} — endpoint returns 501 until implemented</Alert>}
        {loading && <><Skeleton h={12} /><Skeleton h={12} w="80%" /><Skeleton h={12} w="60%" /></>}
        {data ? <JsonViewer data={data} /> : null}
        {!data && !loading && !error && (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 12 }}>
            Click ▶ Fetch to call the endpoint
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// EXAM SIMULATION PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ExamSimPage: FC = () => {
  const [examCat, setExamCat] = useState("WAEC");
  const [timeLimitMins, setTimeLimitMins] = useState(60);
  const [year, setYear] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [simId, setSimId] = useState("");
  const [simStatus, setSimStatus] = useState<unknown>(null);

  const startSim = async () => {
    setLoading(true); setError(""); setResult(null);
    try {
      const body: Record<string, unknown> = { examCategory: examCat, timeLimitMins };
      if (year) body.year = parseInt(year);
      const res = await apiFetch("/exams/simulate", { method: "POST", body: JSON.stringify(body) });
      setResult(res);
      const r = res as { id?: string };
      if (r.id) setSimId(r.id);
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const checkSim = async () => {
    if (!simId) { setError("Start a simulation first to get an ID"); return; }
    setLoading(true); setError("");
    try {
      const res = await apiFetch(`/exams/simulate/${simId}`);
      setSimStatus(res);
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="g2">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Start Exam Simulation</div><div className="card-sub">POST /api/v1/exams/simulate</div></div></div>
          <Alert type="info">Timed full-length exam. Server enforces the time limit and auto-submits on timeout. Separate model from Quiz.</Alert>
          <div className="fg">
            <label className="flabel">Exam Category</label>
            <select className="finput fselect" value={examCat} onChange={e => setExamCat(e.target.value)}>
              {["WAEC","JAMB","NECO","GCE","IGCSE","SAT","IELTS","GMAT","GRE"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="flabel">Time Limit (minutes)</label>
            <input className="finput" type="number" min={10} max={240} value={timeLimitMins}
              onChange={e => setTimeLimitMins(parseInt(e.target.value))} />
          </div>
          <div className="fg">
            <label className="flabel">Past Year (optional)</label>
            <input className="finput" placeholder="e.g. 2023" value={year} onChange={e => setYear(e.target.value)} />
          </div>
          <button className="btn btn-primary btn-full" onClick={() => void startSim()} disabled={loading}>
            {loading ? "Starting…" : "▶ Start Simulation"}
          </button>
          {error && <Alert type="err" >{error}</Alert>}
          {result ? <div className="mt16"><JsonViewer data={result} /></div> : null}
        </div>

        <div className="card">
          <div className="card-hd"><div><div className="card-title">Simulation Status</div><div className="card-sub">GET /api/v1/exams/simulate/:id</div></div></div>
          <div className="fg">
            <label className="flabel">Simulation ID</label>
            <input className="finput" placeholder="Auto-filled after start" value={simId} onChange={e => setSimId(e.target.value)} />
          </div>
          <button className="btn btn-ghost btn-full" onClick={() => void checkSim()} disabled={loading}>Check Status</button>
          {simStatus ? <div className="mt16"><JsonViewer data={simStatus} /></div> : null}
          <div className="divider" />
          <div className="card-title" style={{ marginBottom: 12 }}>All Simulation Endpoints</div>
          {[
            ["POST", "/exams/simulate", "Start timed exam"],
            ["GET", "/exams/simulate/me", "My simulation history"],
            ["GET", "/exams/simulate/:id", "Get running simulation + time left"],
            ["POST", "/exams/simulate/:id/submit", "Manual submit"],
            ["GET", "/exams/simulate/:id/results", "Full results + AI analysis"],
          ].map(([m, p, d]) => (
            <div key={p} className="ep-row" style={{ marginBottom: 5 }}>
              <span className={`ep-method ${m}`}>{m}</span>
              <span className="ep-path" style={{ fontSize: 10.5 }}>{p}</span>
              <span className="ep-desc">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// TUTOR MARKETPLACE PAGE
// ─────────────────────────────────────────────────────────────────────────────

type TutorTab = "browse" | "apply" | "bookings";

const TutorPage: FC = () => {
  const [tab, setTab] = useState<TutorTab>("browse");
  const [tutors, setTutors] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [applyForm, setApplyForm] = useState({ bio: "", yearsOfExperience: "2", hourlyRate: "5000" });
  const [applyResult, setApplyResult] = useState<unknown>(null);
  const [bookings, setBookings] = useState<unknown>(null);

  const browseTutors = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/tutors") as unknown[];
      setTutors(Array.isArray(res) ? res : []);
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); setTutors([]); }
    finally { setLoading(false); }
  };

  const submitApplication = async () => {
    setLoading(true); setError(""); setApplyResult(null);
    try {
      const res = await apiFetch("/tutors/apply", {
        method: "POST",
        body: JSON.stringify({ bio: applyForm.bio, qualifications: ["B.Sc Mathematics"], specializations: ["Mathematics"], subjectIds: [], yearsOfExperience: parseInt(applyForm.yearsOfExperience), hourlyRate: parseFloat(applyForm.hourlyRate) }),
      });
      setApplyResult(res);
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const fetchBookings = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiFetch("/bookings/me");
      setBookings(res);
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="tabs">
        {(["browse","apply","bookings"] as TutorTab[]).map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "browse" ? "🔍 Browse Tutors" : t === "apply" ? "📋 Apply as Tutor" : "📅 My Bookings"}
          </button>
        ))}
      </div>

      {tab === "browse" && (
        <div className="fi">
          <div className="card">
            <div className="card-hd"><div><div className="card-title">Browse Tutors</div><div className="card-sub">GET /api/v1/tutors</div></div>
              <button className="btn btn-primary btn-sm" onClick={() => void browseTutors()} disabled={loading}>▶ Fetch Tutors</button>
            </div>
            {error && <Alert>{error}</Alert>}
            {loading && <><Skeleton h={40} mb={8} /><Skeleton h={40} mb={8} /></>}
            {tutors.length > 0 ? (
              <div className="tbl-wrap"><table>
                <thead><tr><th>Name</th><th>Specialization</th><th>Rating</th><th>Rate/hr</th><th>Verified</th></tr></thead>
                <tbody>{tutors.map((t, i) => {
                  const tt = t as Record<string, unknown>;
                  return <tr key={i}><td>{String(tt.name ?? "—")}</td><td>{String(tt.specializations ?? "—")}</td><td>{String(tt.rating ?? "—")}</td><td>{String(tt.hourlyRate ?? "—")}</td><td>{tt.isVerified ? <Badge variant="green">✓</Badge> : <Badge variant="muted">Pending</Badge>}</td></tr>;
                })}</tbody>
              </table></div>
            ) : !loading && <div style={{ textAlign: "center", padding: "28px 0", color: "var(--text3)", fontFamily: "var(--mono)", fontSize: 12 }}>Click ▶ Fetch Tutors — returns 501 until implemented</div>}
          </div>
          <div className="mt14 card">
            <div className="card-title mb12">Tutor Marketplace Endpoints</div>
            {[["GET","/tutors","Browse tutors"],["GET","/tutors/:id","Tutor profile"],["GET","/tutors/:id/availability","Available slots"],["GET","/tutors/:id/reviews","Tutor reviews"],["POST","/tutors/apply","Submit application"],["PATCH","/tutors/me","Update own profile"],["PATCH","/tutors/me/availability","Update availability"],["GET","/tutors/me/sessions","My sessions (tutor)"],["GET","/tutors/me/earnings","My earnings (tutor)"]].map(([m,p,d]) => (
              <div key={p} className="ep-row" style={{ marginBottom:5 }}>
                <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "apply" && (
        <div className="fi g2">
          <div className="card">
            <div className="card-hd"><div><div className="card-title">Tutor Application</div><div className="card-sub">POST /api/v1/tutors/apply</div></div></div>
            <div className="fg"><label className="flabel">Bio (min 50 chars)</label>
              <textarea className="finput" rows={4} value={applyForm.bio} onChange={e => setApplyForm(f => ({ ...f, bio: e.target.value }))} placeholder="I am a Mathematics graduate with 5+ years experience teaching WAEC students..." /></div>
            <div className="fg"><label className="flabel">Years of Experience</label>
              <input className="finput" type="number" value={applyForm.yearsOfExperience} onChange={e => setApplyForm(f => ({ ...f, yearsOfExperience: e.target.value }))} /></div>
            <div className="fg"><label className="flabel">Hourly Rate (NGN)</label>
              <input className="finput" type="number" value={applyForm.hourlyRate} onChange={e => setApplyForm(f => ({ ...f, hourlyRate: e.target.value }))} /></div>
            <button className="btn btn-primary btn-full" onClick={() => void submitApplication()} disabled={loading}>{loading ? "Submitting…" : "Submit Application"}</button>
            {error && <Alert>{error}</Alert>}
            {applyResult ? <div className="mt12"><JsonViewer data={applyResult} /></div> : null}
          </div>
          <div className="card">
            <div className="card-title mb12">Application Flow</div>
            {[["1","Submit application via POST /tutors/apply","amber"],["2","Admin reviews in /admin/tutors/applications","amber"],["3","PATCH /admin/tutors/:id/approve — status → APPROVED","amber"],["4","Tutor profile goes live in marketplace","green"]].map(([n,l,c]) => (
              <div key={n} style={{ display:"flex", gap:10, padding:"10px 0", borderBottom:"1px solid var(--border)", alignItems:"flex-start" }}>
                <Badge variant={c as "amber"|"green"}>{n}</Badge>
                <span style={{ fontSize:12.5, color:"var(--text2)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "bookings" && (
        <div className="fi">
          <div className="card">
            <div className="card-hd"><div><div className="card-title">My Bookings</div><div className="card-sub">GET /api/v1/bookings/me</div></div>
              <button className="btn btn-primary btn-sm" onClick={() => void fetchBookings()} disabled={loading}>▶ Fetch</button>
            </div>
            {error && <Alert>{error}</Alert>}
            {loading && <Skeleton h={40} />}
            {bookings ? <JsonViewer data={bookings} /> : null}
          </div>
          <div className="mt14 card">
            <div className="card-title mb12">Booking Endpoints</div>
            {[["POST","/bookings","Create booking"],["GET","/bookings/me","My bookings"],["GET","/bookings/:id","Single booking"],["PATCH","/bookings/:id/cancel","Cancel"],["PATCH","/bookings/:id/reschedule","Reschedule"],["POST","/bookings/:id/review","Post-session review"]].map(([m,p,d]) => (
              <div key={p} className="ep-row" style={{ marginBottom:5 }}>
                <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// PARENT DASHBOARD PAGE
// ─────────────────────────────────────────────────────────────────────────────

const ParentPage: FC = () => {
  const [children, setChildren] = useState<unknown>(null);
  const [reports, setReports] = useState<unknown>(null);
  const [alerts, setAlerts] = useState<unknown>(null);
  const [linkEmail, setLinkEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const call = async (path: string, method = "GET", body?: unknown) => {
    setLoading(true); setError(""); setOk("");
    try {
      const res = await apiFetch(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      return res;
    } catch (e: unknown) { const err = e as { message?: string }; setError(err?.message ?? "Failed"); return null; }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="g2 mb14">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Link a Child Account</div><div className="card-sub">POST /api/v1/parent/link-child</div></div></div>
          <Alert type="info">The student must confirm the link from their account before data becomes visible.</Alert>
          <div className="fg"><label className="flabel">Student Email</label>
            <input className="finput" type="email" placeholder="student@email.com" value={linkEmail} onChange={e => setLinkEmail(e.target.value)} /></div>
          <button className="btn btn-primary btn-full" onClick={async () => { const r = await call("/parent/link-child","POST",{studentEmail:linkEmail}); if(r) setOk("Link request sent!"); }} disabled={loading}>Send Link Request</button>
          {ok && <Alert type="ok">{ok}</Alert>}
          {error && <Alert>{error}</Alert>}
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">My Children</div><div className="card-sub">GET /api/v1/parent/children</div></div>
            <button className="btn btn-primary btn-sm" onClick={async () => { const r = await call("/parent/children"); setChildren(r); }} disabled={loading}>▶ Fetch</button>
          </div>
          {loading && <Skeleton h={40} />}
          {children ? <JsonViewer data={children} /> : <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>Click ▶ Fetch</div>}
        </div>
      </div>
      <div className="g2 mb14">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Weekly AI Reports</div><div className="card-sub">GET /api/v1/parent/reports/weekly</div></div>
            <button className="btn btn-primary btn-sm" onClick={async () => { const r = await call("/parent/reports/weekly"); setReports(r); }} disabled={loading}>▶ Fetch</button>
          </div>
          {reports ? <JsonViewer data={reports} /> : <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>AI-generated weekly report cards per child</div>}
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Alerts</div><div className="card-sub">GET /api/v1/parent/alerts</div></div>
            <button className="btn btn-primary btn-sm" onClick={async () => { const r = await call("/parent/alerts"); setAlerts(r); }} disabled={loading}>▶ Fetch</button>
          </div>
          {alerts ? <JsonViewer data={alerts} /> : <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>Inactivity and low-score alerts</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb12">All Parent Dashboard Endpoints</div>
        {[["POST","/parent/link-child","Link to student account"],["GET","/parent/children","All linked children"],["GET","/parent/children/:id/progress","Child's learning progress"],["GET","/parent/children/:id/activity","Child's recent activity"],["GET","/parent/children/:id/streak","Child's study streak"],["GET","/parent/reports/weekly","AI weekly report cards"],["GET","/parent/alerts","Triggered alerts"],["PATCH","/parent/alerts/settings","Configure thresholds"]].map(([m,p,d]) => (
          <div key={p} className="ep-row" style={{ marginBottom:5 }}>
            <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// FLASHCARDS PAGE
// ─────────────────────────────────────────────────────────────────────────────

const FlashcardsPage: FC = () => {
  const [decks, setDecks] = useState<unknown>(null);
  const [dueCards, setDueCards] = useState<unknown>(null);
  const [newDeck, setNewDeck] = useState({ title: "", description: "" });
  const [deckResult, setDeckResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchDecks = async () => {
    setLoading(true); setError("");
    try { const r = await apiFetch("/flashcards/decks/me"); setDecks(r); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const fetchDue = async () => {
    setLoading(true); setError("");
    try { const r = await apiFetch("/flashcards/due"); setDueCards(r); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const createDeck = async () => {
    setLoading(true); setError("");
    try { const r = await apiFetch("/flashcards/decks", { method:"POST", body: JSON.stringify(newDeck) }); setDeckResult(r); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <Alert type="info">Spaced repetition system using the SM-2 algorithm. Each review updates the card's ease factor, interval, and next review date.</Alert>
      <div className="g2 mb14">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">My Flashcard Decks</div><div className="card-sub">GET /flashcards/decks/me</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => void fetchDecks()} disabled={loading}>▶ Fetch</button>
          </div>
          {loading && <><Skeleton h={32} /><Skeleton h={32} /></>}
          {decks ? <JsonViewer data={decks} /> : !loading && <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>No decks fetched yet</div>}
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Cards Due Today</div><div className="card-sub">GET /flashcards/due</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => void fetchDue()} disabled={loading}>▶ Fetch Due</button>
          </div>
          {dueCards ? <JsonViewer data={dueCards} /> : !loading && <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>SM-2 scheduled reviews for today</div>}
        </div>
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Create Deck</div><div className="card-sub">POST /flashcards/decks</div></div></div>
          <div className="fg"><label className="flabel">Deck Title</label>
            <input className="finput" value={newDeck.title} onChange={e => setNewDeck(f => ({...f, title: e.target.value}))} placeholder="Mathematics — Quadratics" /></div>
          <div className="fg"><label className="flabel">Description</label>
            <input className="finput" value={newDeck.description} onChange={e => setNewDeck(f => ({...f, description: e.target.value}))} placeholder="Key formulas and concepts" /></div>
          <button className="btn btn-primary btn-full" onClick={() => void createDeck()} disabled={loading}>Create Deck</button>
          {error && <Alert>{error}</Alert>}
          {deckResult ? <div className="mt12"><JsonViewer data={deckResult} /></div> : null}
        </div>
        <div className="card">
          <div className="card-title mb12">Flashcard Endpoints</div>
          {[["GET","/flashcards/due","Cards due today"],["GET","/flashcards/decks/me","My decks"],["POST","/flashcards/decks","Create deck"],["GET","/flashcards/decks/:id","Deck + cards"],["POST","/flashcards/decks/:id/cards","Add card"],["POST","/flashcards/:id/review","SM-2 review (AGAIN/HARD/GOOD/EASY)"],["DELETE","/flashcards/:id","Delete card"]].map(([m,p,d]) => (
            <div key={p} className="ep-row" style={{ marginBottom:5 }}>
              <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// STUDY PLANS PAGE
// ─────────────────────────────────────────────────────────────────────────────

const StudyPlanPage: FC = () => {
  const [plan, setPlan] = useState<unknown>(null);
  const [genForm, setGenForm] = useState({ targetExam: "WAEC", targetDate: "", dailyGoalMins: "60" });
  const [genResult, setGenResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPlan = async () => {
    setLoading(true); setError("");
    try { setPlan(await apiFetch("/study-plans/me")); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const generatePlan = async () => {
    setLoading(true); setError(""); setGenResult(null);
    try {
      const r = await apiFetch("/study-plans/generate", { method:"POST", body: JSON.stringify({ targetExam: genForm.targetExam, targetDate: genForm.targetDate || new Date(Date.now() + 90*24*60*60*1000).toISOString(), dailyGoalMins: parseInt(genForm.dailyGoalMins) }) });
      setGenResult(r);
    } catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="g2 mb14">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Active Study Plan</div><div className="card-sub">GET /api/v1/study-plans/me</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => void fetchPlan()} disabled={loading}>▶ Fetch</button>
          </div>
          {error && <Alert>{error}</Alert>}
          {loading && <><Skeleton h={32} /><Skeleton h={32} w="70%" /></>}
          {plan ? <JsonViewer data={plan} /> : !loading && <div style={{ textAlign:"center",padding:"28px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>Click ▶ Fetch to load active plan</div>}
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">AI-Generate Study Plan</div><div className="card-sub">POST /api/v1/study-plans/generate</div></div></div>
          <Alert type="info">AI analyses your weak areas and available time to build a day-by-day plan toward your exam.</Alert>
          <div className="fg"><label className="flabel">Target Exam</label>
            <select className="finput fselect" value={genForm.targetExam} onChange={e => setGenForm(f => ({...f, targetExam: e.target.value}))}>
              {["WAEC","JAMB","NECO","GCE","IGCSE","SAT"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="fg"><label className="flabel">Daily Goal (minutes)</label>
            <input className="finput" type="number" min={15} max={480} value={genForm.dailyGoalMins} onChange={e => setGenForm(f => ({...f, dailyGoalMins: e.target.value}))} /></div>
          <button className="btn btn-primary btn-full" onClick={() => void generatePlan()} disabled={loading}>{loading ? "Generating…" : "🤖 Generate AI Plan"}</button>
          {genResult ? <div className="mt12"><JsonViewer data={genResult} /></div> : null}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb12">Study Plan Endpoints</div>
        {[["GET","/study-plans/me","Active plan"],["POST","/study-plans","Create manually"],["POST","/study-plans/generate","AI-generate plan"],["GET","/study-plans/:id/items","Plan items / schedule"],["PATCH","/study-plans/items/:id/complete","Mark item done"],["PATCH","/study-plans/:id","Update plan"],["DELETE","/study-plans/:id","Delete plan"]].map(([m,p,d]) => (
          <div key={p} className="ep-row" style={{ marginBottom:5 }}>
            <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// SEARCH PAGE
// ─────────────────────────────────────────────────────────────────────────────

const SearchPage: FC = () => {
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");
  const [results, setResults] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!q.trim()) return;
    setLoading(true); setError(""); setResults(null);
    try {
      const res = await apiFetch(`/search?q=${encodeURIComponent(q)}&type=${type}`);
      setResults(res);
    } catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="card mb14">
        <div className="card-hd"><div><div className="card-title">Platform Search</div><div className="card-sub">GET /api/v1/search?q=&type=</div></div></div>
        <div className="g2">
          <div className="fg">
            <label className="flabel">Search Query</label>
            <input className="finput" placeholder="e.g. quadratic equations, WAEC 2023, photosynthesis…" value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") void search(); }} />
          </div>
          <div className="fg">
            <label className="flabel">Content Type</label>
            <select className="finput fselect" value={type} onChange={e => setType(e.target.value)}>
              {["all","course","lesson","question","topic"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => void search()} disabled={loading || !q.trim()}>
          {loading ? "Searching…" : "🔍 Search"}
        </button>
        {error && <Alert>{error}</Alert>}
      </div>
      {results ? (
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Results</div><div className="card-sub">GET /search?q={q}&type={type}</div></div></div>
          <JsonViewer data={results} />
        </div>
      ) : null}
      {!results && !loading && (
        <div className="card">
          <div style={{ textAlign:"center",padding:"40px 0",color:"var(--text3)" }}>
            <div style={{ fontSize:32, marginBottom:10 }}>🔍</div>
            <div style={{ fontFamily:"var(--mono)",fontSize:12 }}>Search across courses, lessons, questions, and topics</div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

type AdminTab = "stats" | "users" | "tutors" | "content" | "analytics";

const AdminPage: FC = () => {
  const [tab, setTab] = useState<AdminTab>("stats");
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchPath = async (path: string) => {
    setLoading(true); setError(""); setData(null);
    try { setData(await apiFetch(path)); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  const tabConfig: Record<AdminTab, { label: string; endpoints: [string,string,string][] }> = {
    stats: { label:"📊 Stats", endpoints:[["GET","/admin/stats","Platform overview"]] },
    analytics: { label:"📈 Analytics", endpoints:[["GET","/admin/analytics/dau","Daily active users"],["GET","/admin/analytics/retention","Retention cohorts"],["GET","/admin/analytics/top-subjects","Top subjects"],["GET","/admin/analytics/ai-usage","AI token usage + cost"],["GET","/admin/analytics/revenue","Revenue breakdown"]] },
    users: { label:"👥 Users", endpoints:[["GET","/admin/users","List all users"],["GET","/admin/users/:id","Get user"],["PATCH","/admin/users/:id/role","Change role"],["POST","/admin/users/:id/suspend","Suspend account"],["POST","/admin/users/:id/impersonate","Support impersonation"]] },
    tutors: { label:"🧑‍🏫 Tutors", endpoints:[["GET","/admin/tutors/applications","Pending applications"],["PATCH","/admin/tutors/:id/approve","Approve tutor"],["POST","/admin/tutors/:id/suspend","Suspend tutor"]] },
    content: { label:"📚 Content", endpoints:[["GET","/admin/questions/flagged","Flagged questions"],["PATCH","/admin/questions/:id/verify","Verify question"],["POST","/admin/questions/bulk-import","Bulk import"],["POST","/admin/courses","Create course"],["PATCH","/admin/courses/:id/publish","Publish course"],["POST","/admin/announcements","Post announcement"],["PATCH","/admin/announcements/:id/publish","Publish announcement"]] },
  };

  return (
    <div className="fi">
      <Alert type="warn">Admin endpoints require ADMIN or SUPER_ADMIN role. Requests with standard user tokens will return 403.</Alert>
      <div className="tabs">
        {(Object.keys(tabConfig) as AdminTab[]).map(t => (
          <button key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {tabConfig[t].label}
          </button>
        ))}
      </div>
      <div className="g2">
        <div className="card">
          <div className="card-title mb12">Endpoints</div>
          {tabConfig[tab].endpoints.map(([m,p,d]) => (
            <div key={p} className="ep-row" style={{ marginBottom:5, cursor:"pointer" }}
              onClick={() => { if (!p.includes(":")) void fetchPath(p); }}>
              <span className={`ep-method ${m}`}>{m}</span>
              <span className="ep-path" style={{fontSize:10.5}}>{p}</span>
              <span className="ep-desc">{d}</span>
            </div>
          ))}
          <div className="mt12" style={{ fontFamily:"var(--mono)",fontSize:10,color:"var(--text3)" }}>Click any endpoint without path params to fetch live</div>
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Response</div><div className="card-sub">Click an endpoint to test</div></div>
            {tab === "stats" && <button className="btn btn-primary btn-sm" onClick={() => void fetchPath("/admin/stats")} disabled={loading}>▶ Fetch Stats</button>}
          </div>
          {error && <Alert>{error}</Alert>}
          {loading && <><Skeleton h={12}/><Skeleton h={12} w="70%"/><Skeleton h={12} w="50%"/></>}
          {data ? <JsonViewer data={data} /> : !loading && <div style={{ textAlign:"center",padding:"32px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>No response yet</div>}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATIONS PAGE
// ─────────────────────────────────────────────────────────────────────────────

const NotificationsPage: FC = () => {
  const [notifs, setNotifs] = useState<unknown>(null);
  const [prefs, setPrefs] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetch_ = async (path: string, setter: (d: unknown) => void) => {
    setLoading(true); setError("");
    try { setter(await apiFetch(path)); }
    catch (e: unknown) { const err = e as {message?:string}; setError(err?.message ?? "Failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="fi">
      <div className="g2 mb14">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">My Notifications</div><div className="card-sub">GET /notifications/me</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => void fetch_("/notifications/me", setNotifs)} disabled={loading}>▶ Fetch</button>
          </div>
          {loading && <Skeleton h={40} />}
          {notifs ? <JsonViewer data={notifs} /> : !loading && <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>Click ▶ Fetch</div>}
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Notification Preferences</div><div className="card-sub">GET /notifications/preferences</div></div>
            <button className="btn btn-primary btn-sm" onClick={() => void fetch_("/notifications/preferences", setPrefs)} disabled={loading}>▶ Fetch</button>
          </div>
          {prefs ? <JsonViewer data={prefs} /> : !loading && <div style={{ textAlign:"center",padding:"24px 0",color:"var(--text3)",fontFamily:"var(--mono)",fontSize:12 }}>Per-type, per-channel settings</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-title mb12">Notification Endpoints</div>
        {[["GET","/notifications/me","All notifications"],["PATCH","/notifications/:id/read","Mark read"],["POST","/notifications/read-all","Mark all read"],["DELETE","/notifications/:id","Delete one"],["GET","/notifications/preferences","Get preferences"],["PATCH","/notifications/preferences","Update preferences (per type + channel)"],["POST","/notifications/push/subscribe","Register push device token"],["DELETE","/notifications/push/subscribe","Unregister device token"]].map(([m,p,d]) => (
          <div key={p} className="ep-row" style={{ marginBottom:5 }}>
            <span className={`ep-method ${m}`}>{m}</span><span className="ep-path" style={{fontSize:10.5}}>{p}</span><span className="ep-desc">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

type Page = "dashboard" | "auth" | "ai" | "progress" | "exams" | "tutors" | "parent" | "flashcards" | "studyplans" | "search" | "admin" | "notifications" | "validators";

export default function App() {
  const [authedUser, setAuthedUser] = useState<AuthUser | null>(() => {
    try { return JSON.parse(localStorage.getItem("user") ?? "null") as AuthUser | null; } catch { return null; }
  });
  const [page, setPage] = useState<Page>("dashboard");
  const { health, checking, refresh } = useHealth();

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken() ?? ""}` },
        body: JSON.stringify({}),
      });
    } catch { /* best-effort */ }
    localStorage.clear();
    setAuthedUser(null);
  };

  if (!authedUser) {
    return (<><style>{STYLES}</style><AuthPage onAuth={(u) => setAuthedUser(u)} /></>);
  }

  const NAV_GROUPS = [
    {
      label: "Core",
      items: [
        { id: "dashboard" as Page, icon: "⬡", label: "Dashboard" },
        { id: "search" as Page, icon: "🔍", label: "Search" },
        { id: "auth" as Page, icon: "🔐", label: "Auth Tester" },
      ],
    },
    {
      label: "Learning",
      items: [
        { id: "ai" as Page, icon: "🤖", label: "FlexBot AI", badge: "LIVE" },
        { id: "exams" as Page, icon: "⏱", label: "Exam Simulator" },
        { id: "flashcards" as Page, icon: "🃏", label: "Flashcards" },
        { id: "studyplans" as Page, icon: "📋", label: "Study Plans" },
        { id: "progress" as Page, icon: "📊", label: "Progress & Analytics" },
      ],
    },
    {
      label: "Platform",
      items: [
        { id: "tutors" as Page, icon: "🧑‍🏫", label: "Tutor Marketplace" },
        { id: "parent" as Page, icon: "👨‍👩‍👧", label: "Parent Dashboard" },
        { id: "notifications" as Page, icon: "🔔", label: "Notifications" },
        { id: "admin" as Page, icon: "⚙️", label: "Admin Panel" },
      ],
    },
    {
      label: "Dev Tools",
      items: [
        { id: "validators" as Page, icon: "✓", label: "Validators" },
      ],
    },
  ];

  const TITLES: Record<Page, string> = {
    dashboard: "Dashboard",
    auth: "Auth Endpoints",
    ai: "AI Tutor — FlexBot",
    progress: "Progress & Analytics",
    exams: "Exam Simulator",
    tutors: "Tutor Marketplace",
    parent: "Parent Dashboard",
    flashcards: "Flashcards — Spaced Repetition",
    studyplans: "Study Plans",
    search: "Platform Search",
    admin: "Admin Panel",
    notifications: "Notifications",
    validators: "Zod Validation Tester",
  };

  return (
    <>
      <style>{STYLES}</style>
      <div className="shell">
        {/* ── SIDEBAR ── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="brand-row">
              <div className="brand-gem">🎓</div>
              <div>
                <div className="brand-name">FlexAcademy</div>
                <div className="brand-sub">Backend Console</div>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_GROUPS.map(grp => (
              <div key={grp.label} className="nav-grp">
                <div className="nav-grp-label">{grp.label}</div>
                {grp.items.map(item => (
                  <button
                    key={item.id}
                    className={`nav-btn ${page === item.id ? "active" : ""}`}
                    onClick={() => setPage(item.id)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    {item.label}
                    {item.badge && <span className="nav-badge">{item.badge}</span>}
                  </button>
                ))}
              </div>
            ))}
            <div className="nav-grp">
              <div className="nav-grp-label">Resources</div>
              <button className="nav-btn" onClick={() => window.open("http://localhost:5000/api/v1/docs", "_blank")}>
                <span className="nav-icon">📖</span> Swagger Docs
              </button>
              <button className="nav-btn" onClick={() => window.open("http://localhost:5000/health", "_blank")}>
                <span className="nav-icon">💓</span> Health Check
              </button>
            </div>
          </nav>

          <div className="sidebar-foot">
            <div className="user-chip">
              <div className="user-av">{authedUser.firstName[0]}{authedUser.lastName[0]}</div>
              <div>
                <div className="user-name">{authedUser.firstName} {authedUser.lastName}</div>
                <div className="user-role">{authedUser.role}</div>
              </div>
              <button className="logout-btn" onClick={() => void handleLogout()} title="Logout">⏻</button>
            </div>
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main className="main">
          <header className="topbar">
            <div className="topbar-title">{TITLES[page]}</div>
            <div className="topbar-right">
              <div className="health-pill" onClick={() => void refresh()}>
                <div className={`hdot ${checking ? "chk" : health?.ok ? "on" : "off"}`} />
                <span>{checking ? "Checking…" : health?.ok ? "API Online" : "API Offline"}</span>
              </div>
              <Badge variant="muted">{new Date().toLocaleTimeString()}</Badge>
            </div>
          </header>

          <div className="content">
            {page === "dashboard"     && <DashboardPage user={authedUser} health={health} />}
            {page === "auth"          && <AuthTesterPage />}
            {page === "ai"            && <AiTutorPage />}
            {page === "progress"      && <ProgressPage />}
            {page === "exams"         && <ExamSimPage />}
            {page === "tutors"        && <TutorPage />}
            {page === "parent"        && <ParentPage />}
            {page === "flashcards"    && <FlashcardsPage />}
            {page === "studyplans"    && <StudyPlanPage />}
            {page === "search"        && <SearchPage />}
            {page === "admin"         && <AdminPage />}
            {page === "notifications" && <NotificationsPage />}
            {page === "validators"    && <ValidatorsPage />}
          </div>
        </main>
      </div>
    </>
  );
}

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Link2, Copy, Check, BarChart3, Trash2, Globe, ArrowRight, 
  Sparkles, QrCode, Download, Smartphone, Laptop, Edit3, ExternalLink, ShieldCheck 
} from 'lucide-react';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

interface SavedUrl {
  original: string;
  short: string;
  code: string;
}

interface AnalyticsData {
  code: string;
  totalClicks: number;
  original: string;
  devices: { type: string; count: number }[];
  referrers: { source: string; count: number }[];
}

export default function App() {
  const [originalUrl, setOriginalUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const customDomain = "nico.sh";

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  const [isRedirecting, setIsRedirecting] = useState(false);

  const [history, setHistory] = useState<SavedUrl[]>(() => {
    const saved = localStorage.getItem('url_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    const path = window.location.pathname;

    if (path && path !== '/' && path !== '/favicon.ico' && !path.includes('.')) {
      const code = path.substring(1);

      setIsRedirecting(true);
      console.log(`[Redirecionador] Iniciando busca pelo código: ${code}`);

      const realizarRedirecionamento = async () => {
        try {
          const response = await api.get(`/urls/${code}`);

          let urlDestino = "";
          if (response.data) {
            if (typeof response.data === 'string') {
              urlDestino = response.data;
            } else if (response.data.originalUrl) {
              urlDestino = response.data.originalUrl;
            }
          }

          if (urlDestino && urlDestino.startsWith('http')) {
            window.location.replace(urlDestino);
          } else {
            window.location.replace('/');
          }
        } catch (err) {
          console.error("[Redirecionador] Erro:", err);
          window.location.replace('/');
        }
      };

      const timer = setTimeout(() => {
        realizarRedirecionamento();
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, []);

  const formatUrl = (url: string): string => {
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`;
    }
    return trimmed;
  };

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!originalUrl) return;

    setLoading(true);
    setError('');
    setShortUrl('');

    const formattedUrl = formatUrl(originalUrl);

    const requestBody: Record<string, string> = {
      originalUrl: formattedUrl
    };

    if (customAlias.trim()) {
      requestBody.customAlias = customAlias.trim();
    }

    try {
      const response = await api.post<{ shortUrl?: string; shortCode?: string }>('/urls', requestBody);

      const rawShort = response.data.shortUrl || response.data.shortCode || '';
      const code = rawShort.split('/').pop() || '';

      const elegantShortUrl = `${window.location.origin}/${code}`;
      setShortUrl(elegantShortUrl);

      setHistory(prev => {
        const exists = prev.some(item => item.code === code);
        if (exists) return prev;
        const newHistory = [{ original: formattedUrl, short: elegantShortUrl, code }, ...prev];
        localStorage.setItem('url_history', JSON.stringify(newHistory));
        return newHistory;
      });

      setOriginalUrl('');
      setCustomAlias('');
    } catch (err: any) {
      console.error(err);

      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Este link personalizado já está em uso. Escolha outro!');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
    }
  };

  const fetchStats = async (code: string, original: string) => {
    setLoadingStats(true);
    try {
      const response = await api.get<any>(`/urls/analytics/${code}`);
      const data = response.data;

      // Suporta propriedades 'totalClicks' ou 'clicks' vindas da API
      const clicks = data.totalClicks !== undefined ? data.totalClicks : (data.clicks !== undefined ? data.clicks : 0);

      setStats({
        code,
        original: data.originalUrl || original,
        totalClicks: clicks,
        devices: data.devices || [],
        referrers: data.referrers || []
      });
    } catch (err) {
      console.error(err);
      alert('Não foi possível obter as estatísticas.');
    } finally {
      setLoadingStats(false);
    }
  };

  const deleteHistoryItem = async (shortToDelete: string) => {
    const code = history.find(h => h.short === shortToDelete)?.code;
    if (!code) return;

    try {
      await api.delete(`/urls/${code}`);

      setHistory(prev => {
        const newHistory = prev.filter(item => item.short !== shortToDelete);
        localStorage.setItem('url_history', JSON.stringify(newHistory));
        return newHistory;
      });

      if (stats && stats.code === code) {
        setStats(null);
      }
    } catch (err) {
      console.error("Erro ao deletar o link no servidor:", err);
      alert("Não foi possível excluir o link do servidor.");
    }
  };

  const displayLink = (code: string) => {
    return `${customDomain}/${code}`;
  };

  const getRealLink = (code: string) => {
    return `${window.location.origin}/${code}`;
  };

  const triggerQrModal = (code: string) => {
    const link = getRealLink(code);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&color=6366f1&bgcolor=0f172a&data=${encodeURIComponent(link)}`;
    setQrCodeUrl(qrUrl);
    setShowQrModal(true);
  };

  const getDevicePercentage = (type: string): number => {
    if (!stats || stats.totalClicks === 0) return 0;
    const found = stats.devices.find(d => d.type.toLowerCase() === type.toLowerCase());
    return found ? Math.round((found.count / stats.totalClicks) * 100) : 0;
  };

  const getReferrerPercentage = (source: string): number => {
    if (!stats || stats.totalClicks === 0) return 0;
    const found = stats.referrers.find(r => r.source.toLowerCase() === source.toLowerCase());
    return found ? Math.round((found.count / stats.totalClicks) * 100) : 0;
  };

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center font-sans">
        <div className="text-center space-y-6 max-w-md px-6">
          <div className="inline-flex bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-full text-indigo-400">
            <ShieldCheck className="h-10 w-10 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Link Seguro Verificado</h2>
            <p className="text-slate-400 text-sm">
              Você está sendo redirecionado de forma segura. Aguarde...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans">
      <header className="border-b border-slate-900 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 p-2 rounded-xl text-white">
              <Link2 className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">
              Nicolas<span className="text-indigo-400">Shortener</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl w-full mx-auto px-6 py-12 flex-grow grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl font-bold tracking-tight">
              Simplifique seus links.
            </h2>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Crie links curtos elegantes, use apelidos personalizados e monitore o engajamento dos seus clientes em tempo real.
            </p>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl space-y-4">
            <form onSubmit={handleShorten} className="space-y-4">
              <div className="relative flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                <Globe className="absolute left-4 h-5 w-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cole seu link longo aqui (ex: google.com)..."
                  value={originalUrl}
                  onChange={(e) => setOriginalUrl(e.target.value)}
                  className="w-full bg-transparent border-0 py-3.5 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none text-sm md:text-base"
                  disabled={loading}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:border-indigo-500/50 transition-all">
                  <Edit3 className="absolute left-4 h-4 w-4 text-slate-500" />
                  <span className="absolute left-10 text-xs md:text-sm text-slate-600 font-medium select-none">
                    nico.sh/
                  </span>
                  <input
                    type="text"
                    placeholder="apelido-customizado (opcional)"
                    value={customAlias}
                    onChange={(e) => setCustomAlias(e.target.value)}
                    className="w-full bg-transparent border-0 py-3.5 pl-[5.2rem] pr-4 text-indigo-300 placeholder-slate-600 focus:outline-none text-xs md:text-sm font-semibold"
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !originalUrl}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? 'Processando...' : 'Encurtar Link'}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl font-medium animate-pulse">
              ⚠️ {error}
            </div>
          )}

          {shortUrl && (
            <div className="bg-gradient-to-r from-indigo-950/40 to-violet-950/40 border border-indigo-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-400 flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Link Gerado
                </span>
                <button
                  onClick={() => triggerQrModal(shortUrl.split('/').pop() || '')}
                  className="text-xs bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <QrCode className="h-3.5 w-3.5" />
                  Ver QR Code
                </button>
              </div>
              <div className="flex items-center justify-between gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <a 
                  href={getRealLink(shortUrl.split('/').pop() || '')} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-indigo-300 font-bold hover:text-indigo-200 break-all flex items-center gap-2"
                >
                  {displayLink(shortUrl.split('/').pop() || '')}
                  <ExternalLink className="h-4 w-4 opacity-50" />
                </a>
                <button
                  onClick={() => copyToClipboard(displayLink(shortUrl.split('/').pop() || ''), -1)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-900 border border-slate-800"
                >
                  {copiedIndex === -1 ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-2">
              Links Criados
            </h3>

            {history.length === 0 ? (
              <p className="text-slate-600 text-sm">Nenhum link criado ainda.</p>
            ) : (
              <div className="space-y-3">
                {history.map((item, index) => (
                  <div key={item.short} className="bg-slate-900/20 border border-slate-900 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="min-w-0 flex-grow">
                      <p className="text-xs text-slate-500 truncate mb-1">{item.original}</p>
                      <a 
                        href={getRealLink(item.code)} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-indigo-400 font-bold text-sm flex items-center gap-1"
                      >
                        {displayLink(item.code)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchStats(item.code, item.original)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 text-indigo-400 text-xs font-semibold border border-slate-800 flex items-center gap-1"
                      >
                        <BarChart3 className="h-3 w-3" /> Métricas
                      </button>
                      <button
                        onClick={() => triggerQrModal(item.code)}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400"
                      >
                        <QrCode className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => copyToClipboard(displayLink(item.code), index)}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-400"
                      >
                        {copiedIndex === index ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <button
                        onClick={() => deleteHistoryItem(item.short)}
                        className="p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-600 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-slate-900/30 border border-slate-900 p-6 rounded-2xl sticky top-24 space-y-6">
            <h3 className="text-lg font-bold text-slate-200 border-b border-slate-900 pb-3 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-400" /> Painel Analítico
            </h3>

            {loadingStats ? (
              <p className="text-sm text-slate-500">Buscando do banco...</p>
            ) : stats ? (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block mb-1">CÓDIGO</span>
                  <span className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-1 rounded">
                    {stats.code}
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center">
                  <span className="text-4xl font-bold text-white block">{stats.totalClicks}</span>
                  <span className="text-[10px] text-slate-500 font-bold">CLIQUES REAIS</span>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-900">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Origem do Tráfego</span>

                  {stats.referrers.length === 0 ? (
                    <p className="text-xs text-slate-500">Sem acessos de referência registrados ainda.</p>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {["WhatsApp / Direct", "Instagram", "TikTok", "Facebook", "Twitter/X", "Outros"].map(source => {
                        const pct = getReferrerPercentage(source);
                        if (pct === 0) return null;
                        return (
                          <div key={source}>
                            <div className="flex justify-between text-slate-400 mb-1">
                              <span>{source}</span>
                              <span className="font-bold">{pct}%</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-900">
                              <div className="bg-indigo-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }}></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-900 space-y-2">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block">Dispositivos</span>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-indigo-400" />
                      <span>Mobile: <strong>{getDevicePercentage("Mobile")}%</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Laptop className="h-4 w-4 text-pink-400" />
                      <span>Desktop: <strong>{getDevicePercentage("Desktop")}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-bold block">REDIRECIONAMENTO</span>
                  <p className="text-xs text-slate-300 break-all font-mono max-h-20 overflow-y-auto">{stats.original}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">Selecione um link e clique em Métricas.</p>
            )}
          </div>
        </div>
      </main>

      {showQrModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl max-w-xs w-full text-center space-y-6">
            <h3 className="text-lg font-bold text-white">QR Code</h3>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 inline-block">
              <img src={qrCodeUrl} alt="QR Code" className="w-40 h-40 mx-auto" />
            </div>
            <div className="space-y-2">
              <a 
                href={qrCodeUrl}
                download="qrcode.png"
                target="_blank"
                rel="noreferrer"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-xs"
              >
                <Download className="h-4 w-4" /> Download PNG
              </a>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full bg-slate-950 border border-slate-800 text-slate-400 py-2 rounded-lg text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600 bg-slate-950">
        <p>© 2026 NicolasShortener. Desenvolvido com arquitetura corporativa Spring & React.</p>
      </footer>
    </div>
  );
}
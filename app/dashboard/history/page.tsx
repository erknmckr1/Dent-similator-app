import { Activity, Clock, User, FileText, Trash2, Edit, Eye, Plus, LogIn, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

// Action type'a göre görünüm
const getActionInfo = (actionType: string) => {
  const actions: Record<string, { label: string; color: string; icon: any }> = {
    'patient.created': { label: 'Hasta Oluşturuldu', color: 'text-primary bg-primary/10', icon: Plus },
    'patient.updated': { label: 'Hasta Güncellendi', color: 'text-blue-600 bg-blue-50', icon: Edit },
    'patient.deleted': { label: 'Hasta Silindi', color: 'text-destructive bg-destructive/10', icon: Trash2 },
    'patient.viewed': { label: 'Hasta Görüntülendi', color: 'text-muted-foreground bg-muted', icon: Eye },
    'CREATE_SIMULATION': { label: 'Simülasyon Oluşturuldu', color: 'text-primary bg-accent', icon: FileText },
    'login': { label: 'Giriş Yapıldı', color: 'text-primary bg-primary/10', icon: LogIn },
    'logout': { label: 'Çıkış Yapıldı', color: 'text-muted-foreground bg-muted', icon: LogOut },
  };
  return actions[actionType] || { label: actionType, color: 'text-muted-foreground bg-muted', icon: Activity };
};

// Simulation type çevirisi
const getSimulationType = (type: string) => {
  const types: Record<string, string> = {
    'whiten': 'Beyazlatma',
    'veneer': 'Veneer',
    'implant': 'İmplant',
  };
  return types[type] || type;
};

// Role badge
const RoleBadge = ({ role }: { role: string }) => {
  const roleColors: Record<string, string> = {
    admin: 'bg-primary/10 text-primary',
    doctor: 'bg-secondary text-secondary-foreground',
  };
  
  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    doctor: 'Doktor',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || 'bg-muted text-muted-foreground'}`}>
      {roleLabels[role] || role}
    </span>
  );
};

// Tarih formatlama
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Az önce';
  if (diffMins < 60) return `${diffMins} dakika önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays < 7) return `${diffDays} gün önce`;
  
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default async function HistoryPage() {
  const supabase = await createClient();
  
  // Activity logs'ları user bilgileriyle birlikte çek
  const { data: historyData, error } = await supabase
    .from('activity_logs')
    .select(`
      *,
      user:users!activity_logs_user_id_fkey(name, email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("History fetch error:", error);
    return (
      <div className="h-full p-6 md:p-8">
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Aktivite geçmişi yüklenirken bir hata oluştu.
        </div>
      </div>
    );
  }

  // İstatistikler için hesaplamalar
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayLogs = historyData?.filter(log => 
    new Date(log.created_at) >= today
  ).length || 0;

  const uniqueUsers = new Set(historyData?.map(log => log.user_id)).size || 0;
  
  const simulationCount = historyData?.filter(log => 
    log.entity === 'SIMULATION' || log.action_type === 'CREATE_SIMULATION'
  ).length || 0;

  return (
    <div className="h-full min-h-screen p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground mb-2">Aktivite Geçmişi</h1>
        <p className="text-muted-foreground">Kliniğinizdeki tüm aktiviteleri görüntüleyin</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{todayLogs}</p>
              <p className="text-sm text-muted-foreground">Bugünkü Aktivite</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
              <User className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{uniqueUsers}</p>
              <p className="text-sm text-muted-foreground">Aktif Kullanıcı</p>
            </div>
          </div>
        </div>
        
        <div className="bg-card rounded-lg p-4 border border-border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <FileText className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{simulationCount}</p>
              <p className="text-sm text-muted-foreground">Simülasyon</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity List */}
      <div className="bg-card overflow-y-auto rounded-lg border border-border shadow-sm">
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Son Aktiviteler</h2>
        </div>
        
        {historyData && historyData.length > 0 ? (
          <div className="divide-y divide-border h-[600px] overflow-y-auto">
            {historyData.map((log) => {
              const actionInfo = getActionInfo(log.action_type);
              const Icon = actionInfo.icon;
              const isAuthAction = log.action_type === 'login' || log.action_type === 'logout';
              
              return (
                <div key={log.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-lg ${actionInfo.color} flex items-center justify-center shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">
                            {log.user?.name || 'Bilinmeyen Kullanıcı'}
                          </span>
                          {log.user?.role && <RoleBadge role={log.user.role} />}
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-sm">{formatDate(log.created_at)}</span>
                        </div>
                      </div>
                      
                      {/* Details */}
                      {log.metadata && (
                        <div className="text-sm text-muted-foreground space-y-1">
                          {/* Login/Logout için farklı gösterim */}
                          {isAuthAction ? (
                            <>
                              {log.metadata.email && (
                                <p>E-posta: <span className="font-medium text-foreground">{log.metadata.email}</span></p>
                              )}
                              {log.metadata.ip_address && (
                                <p>IP Adresi: <span className="font-medium text-foreground">{log.metadata.ip_address}</span></p>
                              )}
                              {log.metadata.login_time && (
                                <p>Giriş Zamanı: <span className="font-medium text-foreground">
                                  {new Date(log.metadata.login_time).toLocaleString('tr-TR')}
                                </span></p>
                              )}
                              {log.metadata.logout_time && (
                                <p>Çıkış Zamanı: <span className="font-medium text-foreground">
                                  {new Date(log.metadata.logout_time).toLocaleString('tr-TR')}
                                </span></p>
                              )}
                            </>
                          ) : (
                            <>
                              {/* Hasta işlemleri için gösterim */}
                              {log.metadata.name && (
                                <p>Hasta: <span className="font-medium text-foreground">{log.metadata.name}</span></p>
                              )}
                              {log.metadata.simulationType && (
                                <p>Tip: <span className="font-medium text-foreground">{getSimulationType(log.metadata.simulationType)}</span></p>
                              )}
                              {log.metadata.phone && (
                                <p>Telefon: <span className="font-medium text-foreground">{log.metadata.phone}</span></p>
                              )}
                              {log.metadata.gender && (
                                <p>Cinsiyet: <span className="font-medium text-foreground">{log.metadata.gender === 'Male' ? 'Erkek' : 'Kadın'}</span></p>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground">
            Henüz aktivite kaydı bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}
import {useState} from 'react';
import {readSetting,writeSetting} from '../services/apiClient';
export function StartupConnections({onManage}:{onManage:()=>void}){
 const [visible,setVisible]=useState(()=>!readSetting('local_voice_notice_v1',false));
 if(!visible)return null;
 const dismiss=()=>{writeSetting('local_voice_notice_v1',true);setVisible(false);};
 return <section className="startup-connections product-card" aria-labelledby="startup-connections-title" role="region"><h2 id="startup-connections-title">Yerel sesli dersler</h2><p>Türkçe EMA, İngilizce yerel İngilizce motoruyla anlatılır. Ders sesleri için internet veya API anahtarı gerekmez. Ses dosyaları cihazında saklanır.</p><p>Ses hazırlanamazsa yönetici panelinden yerel ses kurulumunu kontrol edin. Bağlantı gerektiren diğer araçlar isteğe bağlıdır.</p><div className="product-actions"><button className="btn btn-primary" onClick={()=>{dismiss();onManage();}}>Yönetici paneline git</button><button className="btn btn-secondary" onClick={dismiss}>Derslere devam et</button></div></section>;
}

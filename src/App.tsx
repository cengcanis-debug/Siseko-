import { useState } from 'react';

export default function App() {
  const [trips, setTrips] = useState<any[]>([]);
  const [form, setForm] = useState({date:'', from:'', to:'', reason:'', o1:'', o2:'', type:'Business'});
  const [r7, setR7] = useState({trav:'', subs:'', days:''});
  const [r7out, setR7out] = useState('');
  const [biz, setBiz] = useState(0); const [priv, setPriv] = useState(0);

  const addTrip = () => {
    const km = Number(form.o2) - Number(form.o1);
    if (km <= 0) return alert('Check odo');
    const nt = [...trips, {...form, km}]; setTrips(nt);
    let b=0,p=0; nt.forEach((x:any)=>{ x.type==='Business'?b+=x.km:p+=x.km }); setBiz(b); setPriv(p);
  };
  const genLB = () => {
    if(!trips.length) return alert('Add trips');
    let txt=`SARS LOGBOOK IN17 DRAFT - Ilitha Fintech - Capitec 2121467447 - 0847392469\n${new Date().toLocaleString()}\n\n`;
    trips.forEach((x:any,i:number)=>{txt+=`${i+1}. ${x.date} ${x.from}->${x.to} ${x.reason} ${x.km}km ${x.type}\n`});
    txt+=`\nBusiness ${biz}km Private ${priv}km Total ${biz+priv}km %${biz+priv?Math.round(biz/(biz+priv)*100):0}%\nDRAFT - Keep 5 years`;
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([txt],{type:'text/plain'})); a.download='SARS_Logbook_DRAFT.txt'; a.click();
  };
  const calcR7 = () => {
    const trav=Number(r7.trav)||0, subs=Number(r7.subs)||0, days=Number(r7.days)||0;
    const taxTrav=trav*0.2, exempt=Math.min(subs,days*156), taxSubs=subs-exempt;
    setR7out(`Travel R${trav} Taxable 20% R${taxTrav.toFixed(2)} | Subs R${subs} Exempt R${exempt.toFixed(2)} Taxable R${taxSubs.toFixed(2)} - Offline BGR41`);
  };

  return (
    <div style={{background:'#0a1930', color:'white', minHeight:'100vh', padding:12, fontFamily:'system-ui'}}>
      <div style={{background:'#fffbe6', color:'#000', border:'2px dashed #ff9f1c', padding:12, borderRadius:12, fontSize:12, lineHeight:1.6}}>
        <b>💳 DEV RECOVERY - Capitec SL Cengcani 2121467447 - Branch 470010 Savings - Cell 0847392469</b><br/>Ref: Cell+Package | WhatsApp POP to 0847392469 → License ILITHA-30D-XXXX in 15min<br/>Invoice by Ilitha Fintech Reg 2026/707498/07 | Post-launch → Paystack
      </div>
      <h2 style={{marginTop:14}}>Ilitha Fintech Hub - ZATax Logbook IN17 + Rule7 + LegalEstates Independent</h2>
      <p style={{fontSize:12, color:'#a0c4ff'}}>Proactive Tax Compliance 2025/2026 - Client generates & submits himself - DRAFT watermarked</p>

      <div style={{background:'white', color:'black', borderRadius:14, padding:14, marginTop:12}}>
        <h3>A. ZATax + Logbook IN17 + Rule7 Calculator + BEE TEMPLATE</h3>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:8}}>
          <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <input placeholder="From" value={form.from} onChange={e=>setForm({...form,from:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <input placeholder="To" value={form.to} onChange={e=>setForm({...form,to:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <input placeholder="Reason e.g., Client meeting" value={form.reason} onChange={e=>setForm({...form,reason:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <input type="number" placeholder="Odo Start" value={form.o1} onChange={e=>setForm({...form,o1:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <input type="number" placeholder="Odo End" value={form.o2} onChange={e=>setForm({...form,o2:e.target.value})} style={{padding:8,border:'1px solid #ccc',borderRadius:8}}/>
          <select value={form.type} onChange={e=>setForm({...form,type:e.target.value})} style={{padding:8,borderRadius:8}}><option>Business</option><option>Private</option></select>
        </div>
        <button onClick={addTrip} style={{width:'100%',padding:10,background:'#0d2c54',color:'white',borderRadius:20,marginTop:8,fontWeight:700}}>Add Trip</button>
        <p style={{fontSize:11,marginTop:6}}>Business: {biz}km Private: {priv}km Total: {biz+priv}km %{biz+priv?Math.round(biz/(biz+priv)*100):0}</p>
        <button onClick={genLB} style={{width:'100%',padding:10,background:'#00a896',color:'white',borderRadius:20,fontWeight:700}}>Generate Logbook DRAFT TXT</button>
        <div style={{marginTop:10}}>
          <h4>Rule7(1) Subsistence + Rule7(2) Travel</h4>
          <input type="number" placeholder="Travel Allowance R" value={r7.trav} onChange={e=>setR7({...r7,trav:e.target.value})} style={{width:'100%',padding:8,margin:'4px 0',borderRadius:8,border:'1px solid #ccc'}}/>
          <input type="number" placeholder="Subsistence R" value={r7.subs} onChange={e=>setR7({...r7,subs:e.target.value})} style={{width:'100%',padding:8,margin:'4px 0',borderRadius:8,border:'1px solid #ccc'}}/>
          <input type="number" placeholder="Days away" value={r7.days} onChange={e=>setR7({...r7,days:e.target.value})} style={{width:'100%',padding:8,margin:'4px 0',borderRadius:8,border:'1px solid #ccc'}}/>
          <button onClick={calcR7} style={{width:'100%',padding:10,background:'#0d2c54',color:'white',borderRadius:20}}>Calculate</button>
          <div style={{fontSize:11,background:'#f0f8ff',padding:8,borderRadius:8,marginTop:6}}>{r7out||'Result'}</div>
        </div>
        <p style={{fontSize:10,color:'#c1121f',fontWeight:700,marginTop:8}}>FREE 3 trips | R49/mo Vault+Logbook+Rule7 | R99 12mo | R149 BEE+Logbook | Capitec 2121467447</p>
      </div>

      <div style={{background:'#fff8e6',color:'black',borderRadius:14,padding:14,marginTop:10,borderLeft:'5px solid #ff9f1c'}}>
        <h3>G. LegalEstates Independent + Rule7 PoA + Lost Logbook RC1</h3>
        <p style={{fontSize:11}}>Will (Wills Act - 2 witnesses) + Estate S18(3) &lt;R250k J243 Inventory TEMPLATE + Lease CPA + PoA + Lost Logbook affidavit. &gt;R250k referral R750. DRAFT - Sign/Swear at SAPS</p>
        <p style={{fontSize:11,fontWeight:700}}>R99 Lite | R199 All+Vault | Activate 0847392469</p>
      </div>

      <div style={{background:'white',color:'black',borderRadius:14,padding:14,marginTop:10,borderLeft:'5px solid #c1121f'}}>
        <h3>🔥 Bundles R203k Dev Target</h3>
        <p style={{fontSize:12}}>R299 All-Access Comply | R349 Family Protection BEST | R399 Mega All 7</p>
        <a href="https://wa.me/27847392469?text=Hi%20I%20paid%20Capitec%202121467447%20R349%20Family%20POP%20attached" style={{display:'inline-block',background:'#25D366',color:'white',padding:'10px 14px',borderRadius:20,textDecoration:'none',fontWeight:700}}>WhatsApp POP 0847392469 - Capitec 2121467447</a>
      </div>

      <p style={{fontSize:8,textAlign:'center',color:'#888',marginTop:12}}>Ilitha Fintech Reg 2026/707498/07 - Dev Recovery via Capitec 2121467447 SL Cengcani - No live SARS/CSD - DRAFT templates - POPIA - 6787 Unique Homes Mangaung</p>
    </div>
  );
}

import { el } from '../shared.js'
import { nativeFor, nativeStoryDate } from '../../domain/native-apps.js'
import { formatMoney } from '../../domain/pocket-wallet.js'
import { act, form, input, select, type NativeHost } from './native-ui.js'
import { avatar, bottomNav, empty, go, header, icon, scroll, subBack, textButton, tool } from './native-chrome.js'

export function renderBank(h:NativeHost,root:HTMLElement,back:HTMLElement):void {
  const wallet=nativeFor(h.state).wallet,panel=h.ui.panels.bank||'home',money=(n:number)=>formatMoney(n,wallet.currency)
  const navigate=(view:string,id?:string)=>go(h,view,id),send=(action:string,data:any,view='home')=>h.action('bank',action,data,()=>navigate(view))
  const nav=()=>bottomNav(h,[['home','Home','wallet'],['activity','Activity','chart'],['plans','Plans','calendar'],['settings','Settings','settings']],panel)
  const card=()=>{const face=el('div','bk-debit-card'),top=el('div','bk-card-top');top.append(el('strong','','pocket'),icon('wallet'));const chip=el('span','bk-chip');chip.setAttribute('aria-hidden','true');face.append(top,chip,el('span','bk-card-number','••••  ••••  ••••  0427'));const foot=el('div','bk-card-foot');foot.append(el('span','',h.state.pocketPersona.displayName),el('strong','','DEBIT'));face.append(foot);return face}
  const transactionRows=(limit:number)=>{const list=el('div','bk-transactions');for(const tx of [...wallet.transactions].reverse().slice(0,limit)){
    const row=textButton('',()=>navigate('transaction',tx.id),'bk-transaction'),copy=el('span','bk-transaction-copy');copy.append(el('strong','',tx.label),el('small','',tx.external?`Paid by ${tx.payer}`:tx.category));row.append(avatar(tx.category,'bk-merchant'),copy,el('strong',tx.amount>0?'bk-income':'',`${tx.external?'':tx.amount>0?'+':''}${money(tx.external?Math.abs(tx.amount):tx.amount)}`));list.append(row)
  }if(!wallet.transactions.length)list.append(empty('A fresh start','Your payments and incoming money will appear here.','wallet'));return list}
  const editor=(title:string,...children:Node[])=>{root.append(header(title,subBack(h,['loan_add','bill_add'].includes(panel)?'plans':'home')),scroll(...children));root.classList.add('na-editor')}
  if(['add','pay','transfer'].includes(panel)){
    const incoming=panel==='add',transfer=panel==='transfer',title=incoming?'Add money':transfer?'Send money':'Record a payment'
    const amount=input(h,'bank-amount','Amount','number'),label=input(h,'bank-label',transfer?'To':'Description'),category=select(h,'bank-category','Category',['Food','Travel','Home','Shopping','Gift','Salary','Transfer','Other'].map(c=>[c,c]),incoming?'Salary':transfer?'Transfer':'Food')
    amount.classList.add('bk-amount-field');const available=el('div','bk-available');available.append(el('span','','Available balance'),el('strong','',money(wallet.balance)))
    editor(title,available,form(h,title,[amount,label,category,...(!incoming?[input(h,'bank-payer','Paid by','text','You')]:[])],incoming?'Add to balance':transfer?'Send money':'Save payment',d=>send('transaction',{amount:Math.abs(Number(d['bank-amount']))*(incoming?1:-1),label:transfer?`Transfer to ${d['bank-label']}`:d['bank-label'],category:d['bank-category'],payer:d['bank-payer']||'You'})));return
  }
  if(panel==='transaction'){
    const tx=wallet.transactions.find(t=>t.id===h.ui.selected.bank);if(!tx){navigate('home');return}
    const detail=el('div','bk-receipt');detail.append(avatar(tx.category,'bk-receipt-icon'),el('h2','',tx.label),el('strong','bk-receipt-amount',money(tx.amount)),el('span','',tx.at.slice(0,10)||'Story date not set'))
    const fields=el('dl','bk-receipt-fields');for(const [a,b]of [['Category',tx.category],['Paid by',tx.payer],['Account',wallet.currency]])fields.append(el('dt','',a),el('dd','',b));detail.append(fields)
    if(!['Loan','Bill','Stream'].includes(tx.category))detail.append(textButton('Undo this transaction',()=>send('transaction_delete',{id:tx.id}),'na-button na-danger'));editor('Transaction',detail);return
  }
  if(panel==='settings'){
    root.append(header('Wallet settings',back));const body=scroll();body.classList.add('bk-settings')
    const linked=h.state.trackers.find(t=>t.id===wallet.trackerId),sync=el('section','bk-sync')
    sync.append(el('h2','','Money tracker'),el('p','',linked?`${linked.label} shares this wallet’s balance. Bank payments and counter changes stay in sync.`:'Connect an existing money counter so it shares this balance.'))
    if(linked)sync.append(textButton('Disconnect tracker',()=>send('tracker_unlink',{},'settings')))
    else{
      const targets=h.state.trackers.filter(t=>t.kind==='counter'||t.kind==='meter');if(targets.length){const choice=select(h,'bank-tracker','Money tracker',targets.map(t=>[t.id,`${t.label} · ${t.value} ${t.unit}`]));const actions=el('div','bk-sync-choices');actions.append(textButton('Use tracker balance',()=>send('tracker_link',{trackerId:h.ui.drafts['bank-tracker']||targets[0].id,source:'tracker'},'settings')),textButton('Use bank balance',()=>send('tracker_link',{trackerId:h.ui.drafts['bank-tracker']||targets[0].id,source:'bank'},'settings')));sync.append(choice,actions)}else sync.append(el('small','','Create a numeric counter or meter in Trackers to connect it here.'))
    }
    body.append(sync,form(h,'Adjust balance',[input(h,'amount','Balance','number',String(wallet.balance))],'Save balance',d=>send('balance',d,'settings')))
    const currencies:string[]=typeof (Intl as any).supportedValuesOf==='function'?(Intl as any).supportedValuesOf('currency'):['USD','EUR','GBP','JPY','BRL','PYG'];if(!currencies.includes(wallet.currency))currencies.unshift(wallet.currency)
    body.append(form(h,'Currency',[select(h,'currency','Currency',currencies.map(c=>[c,c]),wallet.currency),input(h,'factor','Conversion factor (optional)','number')],'Change currency',d=>send('currency',d,'settings')),form(h,'Custom currency',[input(h,'customCurrency','Currency name or symbol'),input(h,'customFactor','Conversion factor (optional)','number')],'Use custom currency',d=>send('currency',{currency:d.customCurrency,factor:d.customFactor},'settings')));root.append(body,nav());root.classList.add('na-editor');return
  }
  if(panel==='loan_add'||panel==='bill_add'){
    if(panel==='loan_add')editor('New loan',form(h,'Loan details',[input(h,'name','Loan name'),input(h,'amount','Principal','number'),input(h,'months','Term in months','number','12'),input(h,'annualRate','Annual interest (%)','number','0')],'Add loan',d=>send('loan_add',d,'plans')))
    else editor('New bill',form(h,'Bill details',[input(h,'name','Bill name'),input(h,'amount','Amount','number'),input(h,'day','Day of month','number','1'),select(h,'repeat','Repeats',[['monthly','Every month'],['once','One time']],'monthly'),input(h,'date','Date for one-time bill','date')],'Add bill',d=>send('bill_add',d,'plans')));return
  }
  if(panel==='loan'){
    const loan=wallet.loans.find(l=>l.id===h.ui.selected.bank);if(!loan){navigate('plans');return}
    const summary=el('section','bk-loan-detail');summary.append(el('span','','Remaining balance'),el('strong','',money(loan.remaining)),el('p','',`${money(loan.payment)} per month · ${(loan.annualRate*100).toFixed(1)}% annual interest`));const progress=el('progress');progress.max=loan.principal;progress.value=loan.principal-loan.remaining;progress.setAttribute('aria-label','Loan repaid');summary.append(progress,textButton('Pay installment',()=>send('loan_pay',{id:loan.id,mode:'installment'},'plans'),'na-button na-primary'),textButton('Pay in full',()=>send('loan_pay',{id:loan.id,mode:'full'},'plans')))
    editor(loan.name,summary,form(h,'Early payment',[input(h,'early-amount','Payment amount','number'),input(h,'early-payer','Paid by','text','You')],'Make early payment',d=>send('loan_pay',{id:loan.id,mode:'early',amount:d['early-amount'],payer:d['early-payer']},'plans')));return
  }
  if(panel==='plans'){
    const bills=h.ui.drafts['bank-plan-kind']==='bills',switcher=el('div','bk-plan-switch');for(const [id,label]of [['loans','Loans'],['bills','Bills']]){const b=textButton(label,()=>{h.ui.drafts['bank-plan-kind']=id;h.render()});b.setAttribute('aria-pressed',String(bills===(id==='bills')));switcher.append(b)}
    root.append(header('Upcoming payments',back,tool(bills?'Add bill':'Add loan','add',()=>navigate(bills?'bill_add':'loan_add'))));const body=scroll(switcher),list=el('div','bk-obligations')
    if(!bills)for(const loan of wallet.loans){const tile=textButton('',()=>navigate('loan',loan.id),'bk-obligation');tile.append(icon('wallet'),el('strong','',loan.name),el('span','',`${money(loan.remaining)} remaining`),el('small','',`${money(loan.payment)} / month`));list.append(tile)}
    else for(const bill of wallet.bills){const paid=bill.paid.includes(bill.repeat==='once'?bill.date:nativeStoryDate(h.state).slice(0,7)),tile=el('section','bk-obligation');tile.append(icon('calendar'),el('strong','',bill.name),el('span','',money(bill.amount)),el('small','',bill.repeat==='once'?bill.date:`Day ${bill.day} · monthly`));const pay=textButton(paid?'Paid':'Pay bill',()=>send('bill_pay',{id:bill.id},'plans'),'na-button na-small');pay.disabled=paid||h.busy;pay.setAttribute('aria-label',`${paid?'Paid':'Pay bill'} ${bill.name}`);tile.append(pay,tool(`Remove bill ${bill.name}`,'trash',()=>send('bill_delete',{id:bill.id},'plans')));list.append(tile)}
    if(!list.childElementCount)list.append(empty(bills?'No bills on the horizon':'A little breathing room',bills?'Add a bill to keep track of recurring payments.':'Your active loans will appear here.','calendar'));body.append(list);root.append(body,nav());return
  }
  if(panel==='activity'){
    root.append(header('Activity',back));const body=scroll(),spending=wallet.transactions.filter(t=>t.amount<0&&!t.external),categories=new Map<string,number>();for(const t of spending)categories.set(t.category,(categories.get(t.category)||0)+Math.abs(t.amount))
    const total=spending.reduce((n,t)=>n-t.amount,0),chart=el('section','bk-spending');chart.append(el('span','','Total spending'),el('strong','',money(total)));const bars=el('div','bk-category-bars');for(const [category,value]of [...categories].sort((a,b)=>b[1]-a[1]).slice(0,5)){const row=el('div');row.append(el('span','',category),el('strong','',money(value)));const bar=el('i');bar.style.setProperty('--share',`${Math.max(2,value/Math.max(total,1)*100)}%`);row.append(bar);bars.append(row)}chart.append(bars);body.append(chart,el('h2','bk-section-title','Transactions'),transactionRows(100));root.append(body,nav());return
  }
  root.append(header('pocket bank',back,tool('Wallet settings','settings',()=>navigate('settings'))));const body=scroll(),balance=el('section','bk-balance');balance.append(el('span','','Available balance'),el('strong','lp-wallet-balance',money(wallet.balance)));body.append(balance,card())
  const actions=el('div','bk-quick-actions');for(const [id,label,name]of [['add','Add money','add'],['pay','Pay','wallet'],['transfer','Send money','send'],['activity','Insights','chart']]){const b=tool(label,name,()=>navigate(id),'bk-quick-action');b.append(el('span','',label));actions.append(b)}body.append(actions)
  const stats=el('div','bk-stats'),spent=wallet.transactions.filter(t=>t.amount<0&&!t.external).reduce((n,t)=>n-t.amount,0),income=wallet.transactions.filter(t=>t.amount>0).reduce((n,t)=>n+t.amount,0)
  for(const [label,value]of [['Money in',income],['Money out',spent]] as const){const stat=textButton('',()=>navigate('activity'),'bk-stat');stat.append(el('small','',label),el('strong','',money(value)));stats.append(stat)}body.append(stats)
  const recent=el('div','bk-section-head');recent.append(el('h2','','Recent activity'),textButton('See all',()=>navigate('activity'),'na-text-button'));body.append(recent,transactionRows(5));root.append(body,nav())
}

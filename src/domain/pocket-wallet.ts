/** Fictional money only. Amounts are rounded at the active currency's precision. */
export interface WalletTransaction { id:string; amount:number; label:string; category:string; at:string; payer:string; external:boolean }
export interface WalletLoan { id:string; name:string; principal:number; remaining:number; months:number; annualRate:number; payment:number; paidMonths:string[] }
export interface WalletBill { id:string; name:string; amount:number; day:number; repeat:'monthly'|'once'; date:string; paid:string[] }
export interface PocketWallet { trackerId?:string; syncedBalance?:number; currency:string; balance:number; transactions:WalletTransaction[]; loans:WalletLoan[]; bills:WalletBill[] }
export const walletText=(value:unknown,max=120)=>typeof value==='string'?value.trim().slice(0,max):''
const list=(v:unknown):any[]=>Array.isArray(v)?v:[]
export function currencyDigits(currency:string):number { try{return new Intl.NumberFormat('en',{style:'currency',currency}).resolvedOptions().maximumFractionDigits??2}catch{return 2} }
export function walletAmount(value:unknown,currency:string):number {
  const n=Number(value),scale=10**currencyDigits(currency)
  if(!Number.isFinite(n)||Math.abs(n)>1e12||!Number.isSafeInteger(Math.round(n*scale)))throw new Error('Enter a valid amount within the wallet limit.')
  return Math.round((n+Math.sign(n)*Number.EPSILON)*scale)/scale
}
export function formatMoney(value:number,currency:string):string {
  try{return new Intl.NumberFormat('en',{style:'currency',currency,maximumFractionDigits:currencyDigits(currency)}).format(value)}catch{return `${new Intl.NumberFormat('en',{maximumFractionDigits:2}).format(value)} ${currency}`}
}
export function normalizeWallet(raw:any):PocketWallet {
  const currency=walletText(raw?.currency,12)||'USD',amount=(v:unknown)=>{try{return walletAmount(v,currency)}catch{return 0}}
  return {trackerId:walletText(raw?.trackerId)||undefined,syncedBalance:typeof raw?.syncedBalance==='number'?amount(raw.syncedBalance):undefined,currency,balance:amount(raw?.balance??0),transactions:list(raw?.transactions).slice(-500).filter(t=>t&&typeof t.id==='string').map(t=>({id:walletText(t.id),amount:amount(t.amount),label:walletText(t.label),category:walletText(t.category,40),at:walletText(t.at,40),payer:walletText(t.payer,80)||'You',external:t.external===true})),loans:list(raw?.loans).slice(0,30).filter(l=>l?.id).map(l=>({id:walletText(l.id),name:walletText(l.name),principal:Math.max(0,amount(l.principal)),remaining:Math.max(0,amount(l.remaining)),months:Math.max(1,Math.min(600,Number(l.months)||1)),annualRate:Math.max(0,Math.min(2,Number(l.annualRate)||0)),payment:Math.max(0,amount(l.payment)),paidMonths:list(l.paidMonths).filter(x=>typeof x==='string').slice(-600)})),bills:list(raw?.bills).slice(0,60).filter(b=>b?.id).map(b=>({id:walletText(b.id),name:walletText(b.name),amount:Math.max(0,amount(b.amount)),day:Math.max(1,Math.min(31,Math.round(Number(b.day)||1))),repeat:b.repeat==='once'?'once':'monthly',date:walletText(b.date,10),paid:list(b.paid).filter(x=>typeof x==='string').slice(-120)}))}
}
export function transact(wallet:PocketWallet,input:{amount:unknown;label:unknown;category?:unknown;payer?:unknown},id:string,at:string):WalletTransaction {
  const amount=walletAmount(input.amount,wallet.currency),label=walletText(input.label),payer=walletText(input.payer,80)||'You',external=amount<0&&payer!=='You'
  if(!amount||!label)throw new Error('Add an amount and a description.')
  const balance=walletAmount(wallet.balance+(external?0:amount),wallet.currency)
  const transaction={id,amount,label,category:walletText(input.category,40)||'Other',payer,external,at}
  wallet.balance=balance;wallet.transactions=[...wallet.transactions,transaction].slice(-500);return transaction
}
export function convertWallet(wallet:PocketWallet,currency:string,factor?:unknown):PocketWallet {
  currency=walletText(currency,12);if(!currency)throw new Error('Choose a currency or enter a fictional one.')
  const next=structuredClone(wallet),rate=factor===undefined||factor===''?1:Number(factor)
  if(!Number.isFinite(rate)||rate<=0)throw new Error('The conversion factor must be greater than zero.')
  const amount=(n:number)=>walletAmount(n*rate,currency)
  next.currency=currency;next.balance=amount(next.balance)
  next.transactions=next.transactions.map(t=>({...t,amount:amount(t.amount)}))
  next.loans=next.loans.map(l=>({...l,principal:amount(l.principal),remaining:amount(l.remaining),payment:amount(l.payment)}))
  next.bills=next.bills.map(b=>({...b,amount:amount(b.amount)}));return next
}
export function loanPayment(principal:number,months:number,annualRate:number):number {
  if(!Number.isFinite(principal)||principal<=0||!Number.isInteger(months)||months<1||months>600||!Number.isFinite(annualRate)||annualRate<0||annualRate>2)throw new Error('Check the loan amount, term and interest rate.')
  const rate=annualRate/12;return rate?principal*rate/(1-(1+rate)**-months):principal/months
}
export function payLoan(wallet:PocketWallet,loanId:string,amount:unknown,mode:'installment'|'early'|'full',id:string,at:string,payer='You'):void {
  const loan=wallet.loans.find(l=>l.id===loanId);if(!loan||loan.remaining<=0)throw new Error('This loan is no longer active.')
  const month=at.slice(0,7)
  if(mode==='installment'&&loan.paidMonths.includes(month))throw new Error('This month’s installment is already paid.')
  const interest=mode==='installment'?walletAmount(loan.remaining*loan.annualRate/12,wallet.currency):0
  const payment=walletAmount(mode==='full'?loan.remaining:mode==='installment'?Math.min(loan.payment,loan.remaining+interest):amount,wallet.currency)
  if(payment<=0||payment<=interest||payment>loan.remaining+interest)throw new Error('Enter a payment that covers interest without exceeding the remaining debt.')
  if(payer==='You'&&wallet.balance<payment)throw new Error('There is not enough money in this fictional wallet.')
  transact(wallet,{amount:-payment,label:`Loan payment · ${loan.name}`,category:'Loan',payer},id,at)
  loan.remaining=Math.max(0,walletAmount(loan.remaining+interest-payment,wallet.currency));if(mode==='installment')loan.paidMonths.push(month)
}

import {Component,type ReactNode} from 'react';
export class ScreenBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 static getDerivedStateFromError(){return {failed:true};}
 render(){return this.state.failed?<section className="product-card" role="alert"><h1>Bu ekran açılamadı</h1><p>Diğer ekranlardan çalışmaya devam edebilirsin. Mevcut kayıtların korunuyor.</p><button className="btn btn-primary" onClick={()=>this.setState({failed:false})}>Ekranı yeniden dene</button></section>:this.props.children;}
}

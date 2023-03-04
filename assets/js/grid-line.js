class GridLine extends HTMLElement {
  constructor() {
    super();
    this.date = "";
    this.start = "";
    this.end = "";
    this.total = "xxx";
  }

// component attributes
static get observedAttributes() {
    return ['date','start', 'end', 'total'];
  }
  
  // attribute change
  attributeChangedCallback(property, oldValue, newValue) {

    if (oldValue === newValue) return;
    this[ property ] = newValue;
    
  }
  
  // connect component
  connectedCallback() {
    console.log('ddddd')
    this.innerHTML =`Hello ${ this.total }!`;
    // this.textContent = `Hello ${ this.total }!`;
  }

  render() { // (1)

    this.innerHTML = "sssssssssssssssssss"
  }
}

customElements.define("grid-line", GridLine);

// Useful while writing Dial Component:
// https://stackoverflow.com/questions/21845550/css3-translate-3d-transform-with-javascript-drag
// https://css-tricks.com/controlling-css-animations-transitions-javascript/
// http://enome.github.io/javascript/2014/03/24/drag-and-drop-with-react-js.html
// https://stackoverflow.com/questions/27788991/the-drag-event-not-firing-in-firefox-or-ie
// https://kryogenix.org/code/browser/custom-drag-image.html
// On window coords: https://stackoverflow.com/questions/442404/retrieve-the-position-x-y-of-an-html-element
let Util = {
  radToDeg: rad => 180*rad/Math.PI,
  degToRad: deg => deg*Math.PI/180,
};

class ControllableBubbles extends React.Component {
  constructor(props) {    
    super(props);
    
    this.state = {
      windSpeed: 5,
      windDirection: 45
    }
  }
  
  updateWindSpeed(magnitude) {
    this.setState({windSpeed: magnitude});    
  }
  
  updateWindDirection(angle) {
    this.setState({windDirection: angle});
  }  

  getWindVector() {
    let angle = this.state.windDirection,
        windSpeed = this.state.windSpeed,
        rad,
        vector = [];    
    if (angle < 90) {
      rad = Util.degToRad(angle);
      vector = [windSpeed*Math.cos(rad),     
                -windSpeed*Math.sin(rad)];
    }
    else if (angle < 180) {
      angle = angle-90;
      rad = Util.degToRad(angle);
      vector = [-windSpeed*Math.sin(rad),     
                -windSpeed*Math.cos(rad)];      
    }
    else if (angle < 270) {
      angle = angle-180;
      rad = Util.degToRad(angle);
      vector = [windSpeed*Math.cos(rad),     
                -windSpeed*Math.sin(rad)];            
    }
    else {
      angle = angle-270;
      rad = Util.degToRad(angle);
      vector = [windSpeed*Math.sin(rad),     
                windSpeed*Math.cos(rad)];            
    }
    return vector;    
  }
  
  render() {
    
    return (
      <div className="container">
        <header>Bubbles!</header>
        <div className="panel">
          <div className="control-title">Wind</div>
          <div className="wind-speed">
            <label>Wind Speed</label><input type="range"></input>
          </div>
          <div className="direction">
            <label>Direction</label>
              <Dial
                diameter="120px"
                // data bounds. [min,max]
                range={[0, 360]}
                // this is a weight on the pixel length of the drag.
                // options: circular or bounded
                rangeBounds="circular"
                value={this.state.windDirection}
                // options: line or divet
                indicatorStyle="divet"
                // pass in a function that takes one argument, the new value
                change={this.updateWindDirection.bind(this)}
              />
          </div>
        </div>
        <Bubbles
          width="100"
          // the emitter position
          pos={[0, 0]}
          // natural bubble drift without wind
          speed={5}
          windVector={this.getWindVector()}
          bubbleFrequency={1000}
        />      
        </div>
      );
  }
}

class Dial extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      diameter: props.diameter,
      range: props.range,
      rangeBounds: "circular",
      value: props.value,
      indicatorStyle: props.indicatorStyle,
      change: props.change,
      // 1 degree of rotation results in how much value change
      step: (props.range[1]-props.range[0])/360
    };
  }
  getAngle() {
    // in turns
    return -(this.state.value - this.state.range[0]) / this.state.range[1];
  }
  getRotationFromValue(val) {
    return 360*(val - this.state.range[0]) / this.state.range[1];
  }
  getValueFromRotation(deg) {
    return deg*this.state.step+this.state.range[0];    
  }
  handleDragStart(evt) {
    evt.stopPropagation();
    // We're using the component's state rather than the event to pass data.
    evt.dataTransfer.setData("text/plain", "text");
    evt.dataTransfer.setDragImage(
      document.getElementById("dragPreview"), 0, 0);
    evt.persist();
  }
  handleDrag(evt) {
    if (evt.clientX === 0 || evt.clientY === 0) {
      return;
    }
    evt.stopPropagation();
    evt.preventDefault();
    evt.persist();
    console.log('handledrag', evt);
    this.setState((prevState, props) => {
      let // with a center of element origin
        mousePos = [evt.clientX-this.state.center[0],
                    -(evt.clientY-this.state.center[1])],
        h = Math.sqrt(mousePos[0]**2 +mousePos[1]**2),
        mouseAngleRad = Math.acos(mousePos[0]/h),
        nextValue;       
      if (mousePos[1] < 0) {
        mouseAngleRad = 2*Math.PI-mouseAngleRad;
      }
      nextValue = this.getValueFromRotation(Util.radToDeg(mouseAngleRad));
    
//      console.log(`evt.clientXY ${evt.clientX} ${evt.clientY}`);
//     console.log(`mousepos ${mousePos[0]} ${mousePos[1]}`);
//      console.log(`angle ${mouseAngleRad}`);
//     console.log(`nextvalue ${nextValue}`)
      this.state.change(nextValue);    

      return {value: nextValue,
              lastMousePos: mousePos};      
    });
  }
  handleDragEnd(evt) {
  }
  componentDidMount() {
    this.setState((prevData,props) => {
      let el = ReactDOM.findDOMNode(this),
          rect = el.getBoundingClientRect(),
          width = getComputedStyle(el).width.match(/[0-9]+/);
      return {center: [rect.left+width/2,
                       rect.top+width/2]};
    });
  }
  render() {
    let dialStyles = {
        width: "100%",
        height: "100%"
      },
      indicatorClass = ["indicator-", this.state.indicatorStyle].join(""),
      diameter = this.state.diameter.match(/[0-9]+/) / 1,
      diameterUnits = this.state.diameter.match(/[a-z]+/i);
    if (!diameter) {
      throw "Please provide a CSS length value for the dial component's diameter. (e.g. 30vw)";
    }
    let borderPadding = diameter / 30 + diameterUnits,
      borderdiameter = diameter + diameterUnits,
      borderStyles = {
        width: borderdiameter,
        height: borderdiameter,
        padding: borderPadding
      },
       indicatorLength = diameter,
       indicatorStyles = {
      transform: `translateY(${diameter /
        2}${diameterUnits}) translateY(-.75vw) rotate(${this.getAngle()}turn)`
    };

    return (
      <div className="dial-border" style={borderStyles}>
        <div
          className="dial"
          style={dialStyles}
          onDragStart={this.handleDragStart.bind(this)}
          onDrag={this.handleDrag.bind(this)}
          onDragEnd={this.handleDragEnd.bind(this)}
          draggable="true"
        >
          <div className="indicator" style={indicatorStyles}>
            <div className={indicatorClass} />
          </div>
        </div>
        <div id="dragPreview" />
      </div>
    );
  }
}

// --------------------------
// useful while creating the Bubbles portion of the app: https://stackoverflow.com/questions/36985738/how-to-unmount-unrender-or-remove-a-component-from-itself-in-react
// https://stackoverflow.com/questions/29527385/removing-element-from-array-in-component-state
//https://stackoverflow.com/questions/32414308/updating-state-on-props-change-in-react-form

class Bubbles extends React.Component {
  constructor(props) {
    super(props);
    let windSpeed = props.windSpeed;
    this.state = {
      bubbleArr: [],
      pos: props.pos, // origin bottom left, vw, vh
      delta: [props.windVector[0], props.speed + props.windVector[1]], // vw, vh
      width: props.width, // vw
      animStep: 1000,
      animInterval: -1,
      emitInterval: -1,
      bubbleFrequency: props.bubbleFrequency,
      updateBubblesTex: true,
      didUpdateBubblesTex: false,
      nextKey: 0
    };
    document.Bubbles = this;
  }
  
  componentWillReceiveProps(nextProps) {
    let delta = [nextProps.windVector[0], nextProps.speed + nextProps.windVector[1]];
    if (delta[0] !== this.state.delta[0] ||
        delta[1] !== this.state.delta[1]) {
      this.setState({delta: delta});
    }
  }
  
  addBubble() {
    let bubs = this.state.bubbleArr,
      newInterval = this.state.animInterval,
      size = Math.floor(Math.random() * 5 + 3), //vw
      offset =
        Math.floor(Math.random() * (this.state.width - size) * 100) / 100,
      pos = [this.state.pos[0] + offset, this.state.pos[1]];

    if (newInterval === -1) {
      newInterval = setInterval(
        this.updateAnimation.bind(this),
        this.state.animStep
      );
    }
    this.setState({
      bubbleArr: [
        ...bubs,
        {
          id: this.state.nextKey,
          size: size,
          pos: pos,
          updateTexture: true
        }
      ],
      nextKey: this.state.nextKey + 1,
      animInterval: newInterval
    });
  }

  setUpdateBubblesTex(val = true) {
    this.parent.setState({ updateBubblesTex: val });
  }

  // remove bubbles
  handleChildUnmount() {
    let id = this.props.id;
    newInterval = this.parent.state.animInterval;

    if (this.parent.state.bubbleArr.length === 1) {
      clearInterval(this.parent.state.animInterval);
      newInterval = -1;
    }

    this.parent.setState((prevState, props) => {
      let updated = prevState.bubbleArr.slice();
      for (let i = 0; i < updated.length; i++) {
        if (prevState.bubbleArr[i].id === id) {
          updated.splice(i, 1);
          let newState = { bubbleArr: updated };
          if (newInterval === -1) {
            newState.animInterval = newInterval;
          }
          return newState;
        }
      }
    });
  }
  
  getUpdtdPos(pos, delta) {
    let p = pos.slice();
    p[0] += delta[0];
    p[1] += delta[1];
    if (p[0] >= 100 + delta[0] || p[0] <= 0 - delta[0]) {
      return undefined;
    }
    if (p[1] >= 100 + delta[1] || p[1] <= 0 - delta[1]) {
      return undefined;
    }
    return p;
  }

  updateAnimation() {
    this.setState((prevState, props) => {
      let updated = prevState.bubbleArr.slice();
      remove = [];
      for (let i = 0; i < updated.length; i++) {
        let pos = this.getUpdtdPos(updated[i].pos, this.state.delta);
        if (!pos) {
          remove.push(i);
        } else {
          updated[i].pos = pos;
        }
      }
      return {
        bubbleArr: updated.filter((x, i) => !remove.includes(i))
      };
    });
  }

  componentDidMount() {
    this.setState({
      emitInterval: setInterval(
        this.addBubble.bind(this),
        this.state.bubbleFrequency
      )
    });
  }

  onClick(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.addBubble();
  }

  componentDidUpdate() {
    if (this.state.didUpdateBubblesTex) {
      // unset the updateTex flag on the bubbles
      this.setState(prevState => {
        let updated = prevState.bubbleArr.slice();
        for (let i = 0; i < updated.length; i++) {
          updated[i].updateTexture = false;
        }
        return {
          bubbleArr: updated,
          updateBubblesTex: false,
          didUpdateBubblesTex: false
        };
      });
    }
    if (!this.state.updateBubblesTex) {
      return;
    }

    // set the updateTex flag on the bubbles
    this.setState(prevState => {
      let updated = prevState.bubbleArr.slice();
      for (let i = 0; i < updated.length; i++) {
        updated[i].updateTexture = true;
      }
      return {
        bubbleArr: updated,
        updateBubblesTex: false,
        didUpdateBubblesTex: true
      };
    });
  }
  render() {
    let styles = {
      width: this.state.width + "vw",
      left: this.state.pos[0] + "vw",
      bottom: this.state.pos[1] + "vh"
    };
    return (
      <div className="canvas">
        <div
          className="emitter"
          style={styles}
          onClick={this.onClick.bind(this)}
        />
        {this.state.bubbleArr.map(bubble => (
          <Bubble
            key={bubble.id}
            parent={this}
            unmountMe={this.handleChildUnmount}
            props={bubble}
          />
        ))}
      </div>
    );
  }
}

class Bubble extends React.Component {
  onClick(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    this.props.unmountMe();
  }
  updateTexture() {
    let el = ReactDOM.findDOMNode(this),
      style = window.getComputedStyle
        ? getComputedStyle(el, null)
        : el.currentStyle,
      pxWidth = style.width.slice(0, style.width.length - 2);
    const unscaledFgSize = 1115,
      imgWidth = 2364,
      unscaledOffset = [-276, -292];
    let offset = [];
    offset.push(unscaledOffset[0] * pxWidth / unscaledFgSize);
    offset.push(unscaledOffset[1] * pxWidth / unscaledFgSize);

    el.style["background-position"] = `left ${offset[0]}px top ${offset[1]}px`;
  }

  componentDidMount() {
    this.updateTexture();
  }

  render() {
    let p = this.props.props,
      classes = "bubble",
      styles = {
        left: p.pos[0] + "vw",
        bottom: p.pos[1] + "vh",
        height: p.size + "vw",
        width: p.size + "vw"
      };
    return (
      <div className={classes} style={styles} onClick={this.onClick.bind(this)}>
        {this.props.id}
      </div>
    );
  }

  componentDidUpdate() {
    if (this.props.props.updateTexture) {
      this.updateTexture();
    }
  }
}
// ------ Top Level Render ------------------------
ReactDOM.render(
  <ControllableBubbles
  />,
  document.getElementsByClassName("app")[0]
);

// http://youmightnotneedjquery.com/ helped bridge the gap into plain js
function ready(fn) {
  if (
    document.attachEvent
      ? document.readyState === "complete"
      : document.readyState !== "loading"
  ) {
    fn();
  } else {
    document.addEventListener("DOMContentLoaded", fn);
  }
}

ready(function() {
  let elNotice = document.getElementsByClassName("notice")[0],
    elAttrib = document.getElementsByClassName("message")[0],
    show = function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      let el = document.getElementsByClassName("message")[0];
      el.style.visibility = "visible";
    },
    hide = function(evt) {
      evt.stopPropagation();
      evt.preventDefault();
      let el = document.getElementsByClassName("message")[0];
      el.style.visibility = "hidden";
    };

  elNotice.addEventListener("click", show);
  elNotice.addEventListener("touchend", show);
  elAttrib.addEventListener("click", hide);
  elAttrib.addEventListener("touchend", hide);
});

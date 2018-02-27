// Useful while writing this:
// https://stackoverflow.com/questions/21845550/css3-translate-3d-transform-with-javascript-drag
// https://css-tricks.com/controlling-css-animations-transitions-javascript/
// http://enome.github.io/javascript/2014/03/24/drag-and-drop-with-react-js.html
// https://stackoverflow.com/questions/27788991/the-drag-event-not-firing-in-firefox-or-ie
// https://kryogenix.org/code/browser/custom-drag-image.html
class Dial extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      diameter: props.diameter,
      range: props.range,
      rangeBounds: "circular",
      dragRatio: props.dragRatio,
      units: props.units,
      label: props.label,
      value: props.value,
      indicatorStyle: props.indicatorStyle,
      change: props.change,
      lastPos: [0, 0],
      //  2 | 1
      //  3 | 4
      dragStartQuadrant: 1,
      // Last dominant component. If the user changes drag direction
      // during drag, we want to do the right thing
      lastDomComp: 0,
      animInterval: -1,
      animStep: 100
    };
  }
  getQuadrant() {
    let range = this.state.range,
      value = this.state.value,
      quadSize = (range[1] - range[0]) / 4,
      quadUpBound = [],
      quadrant = 4;
    quadUpBound.push(quadSize + range[0]);
    quadUpBound.push(quadSize * 2 + range[0]);
    quadUpBound.push(quadSize * 3 + range[0]);

    if (value < quadUpBound[0]) {
      quadrant = 1;
    } else if (value < quadUpBound[1]) {
      quadrant = 2;
    } else if (value < quadUpBound[2]) {
      quadrant = 3;
    }
    return quadrant;
  }
  getAngle() {
    // in turns
    return -(this.state.value - this.state.range[0]) / this.state.range[1];
  }
  handleDragStart(evt) {
    evt.stopPropagation();
    // We're using the component's state rather than the event to pass data.
    evt.dataTransfer.setData("text/plain", "text");
    evt.dataTransfer.setDragImage(document.getElementById("dragPreview"), 0, 0);
    evt.persist();

    this.setState(() => {
      return {
        lastPos: [evt.clientX, evt.clientY],
        dragStartQuadrant: this.getQuadrant()
      };
    });
  }
  handleDrag(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.persist();

    this.setState((prevState, props) => {
      let lastPos = prevState.lastPos,
        delta = [evt.clientX - lastPos[0], evt.clientY - lastPos[1]],
        dominantComp = Math.abs(delta[0]) < Math.abs(delta[1]) ? 1 : 0,
        magnitude =
          prevState.dragRatio * Math.sqrt(delta[0] ** 2 + delta[1] ** 2),
        value = prevState.value,
        quadrant = this.getQuadrant();
      if (dominantComp == 1) {
        if (quadrant == 1 || quadrant == 4) {
          if (delta[1] < 0) {
            value = value + magnitude;
          } else {
            value = value - magnitude;
          }
        } else {
          if (delta[1] < 0) {
            value = value - magnitude;
          } else {
            value = value + magnitude;
          }
        }
      } else if (dominantComp == 0) {
        if (quadrant == 1 || quadrant == 2) {
          if (delta[0] < 0) {
            value = value + magnitude;
          } else {
            value = value - magnitude;
          }
        } else {
          if (delta[0] < 0) {
            value = value - magnitude;
          } else {
            value = value + magnitude;
          }
        }
      }

      if (prevState.rangeBounds === "bounded") {
        if (value > prevState.range[1]) {
          value = prevState.range[1];
        } else if (value < prevState.range[0]) {
          value = prevState.range[0];
        }
      } else if (prevState.rangeBounds === "circular") {
        if (value > prevState.range[1]) {
          value =
            prevState.range[1] != 0
              ? value % prevState.range[1]
              : prevState.range[0];
        } else if (value < prevState.range[0]) {
          value =
            prevState.range[0] != 0
              ? value % prevState.range[0]
              : prevState.range[1];
        }
      }
      console.log("ratio ", prevState.dragRatio, "value ", value);
      return {
        lastPos: [evt.clientX, evt.clientY],
        value: value,
        dragStartQuadrant: quadrant,
        lastDomComp: dominantComp
      };
    });
  }
  handleDragEnd(evt) {
    this.state.change(this.state.value);
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
      };
    let indicatorLength = diameter;
    let indicatorStyles = {
      transform: `translateY(${diameter /
        2}${diameterUnits}) rotate(${this.getAngle()}turn)`
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

let change = function(value) {
  console.log("Change function, value: " + value);
};
ReactDOM.render(
  <Dial
    diameter="30vw"
    // data bounds. [min,max]
    range={[0, 360]}
    // this is a weight on the pixel length of the drag.
    // How fast do you want the value to change
    dragRatio={1}
    // options: circular or bounded
    rangeBounds="circular"
    units="degrees"
    label="wind"
    value={0}
    // options: line or divet
    indicatorStyle="divet"
    // pass in a function that takes one argument, the new value
    change={change}
  />,
  document.getElementById("app")
);

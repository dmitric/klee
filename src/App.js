import React, { Component } from 'react';
import './App.css';
import Hammer from 'hammerjs'

import { SketchPicker } from 'react-color'
import reactCSS from 'reactcss'
import tinycolor from 'tinycolor2'

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      rows: 10,
      columns: 14,
      width: 100,
      height: 100,
      displayColorPickers: true,
      backgroundColor: "#F3F0EC",
      lineColor: "#201915",
      strokeWidth: 1.25,
      fillColor: "#F3F0EC",
      fillOpacity: 0,
      padding: 120,
      running: true,
      frames: 0
    };
  }

  toggleRun() {
    this.setState({running: !this.state.running})
  }

  tick () {
    if (this.state.running) {
      const update = {frames: this.state.frames + 1}
      this.setState(update)
    }
  }

  generateRandomNumbers (n, m, minRandom) {
    let i = 0
    let randNums = []
    let sum = 0

    minRandom = minRandom || 1/this.state.rows
    
    for (i = 0; i < n; i++) {
      randNums[i] = Math.max(Math.random(), minRandom)
      sum += randNums[i]
    }

    for (i = 0; i < n; i++) {
      randNums[i] /= sum
      randNums[i] *= m
    }

    return randNums;
  }

  between (min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  }

  bound (value, min, max) {
    return Math.min(max, Math.max(min, value))
  };

  decrementColumns () {
    this.setState({columns: Math.max(2, this.state.columns -1) })
  }

  incrementColumns () {
    this.setState({columns: Math.min(40, this.state.columns + 1) })
  }

  decrementRows () {
    this.setState({rows: Math.max(2, this.state.rows -1) })
  }

  incrementRows () {
    this.setState({rows: Math.min(20, this.state.rows + 1) })
  }

  decrementStrokeWidth () {
    this.setState({strokeWidth: Math.max(0.5, this.state.strokeWidth - 0.5) })
  }

  incrementStrokeWidth () {
    this.setState({strokeWidth: Math.min(15, this.state.strokeWidth + 0.5) })
  }

  render() {

    const actualHeight = this.state.height-2*this.state.padding
    const actualWidth = this.state.width-2*this.state.padding

    const accumulate = function(r, a) {
      if (r.length > 0)
        a += r[r.length - 1];
      r.push(a);
      return r;
    }

    var startingYs = this.generateRandomNumbers(this.state.rows, actualHeight).reduce(accumulate, [])
    startingYs.pop()
    
    var allXs = [0].concat(this.generateRandomNumbers(this.state.columns - 1, actualWidth, 0.2).reduce(accumulate, []));

    const lines = []
    const renderLines = []

    for (let i=0; i < startingYs.length; i ++) {
      lines[i] = [{x: allXs[0], y: startingYs[i]}]
      for (let j = 1; j < allXs.length; j++) {
        // add perturbation
        let lastY = lines[i][j-1].y
        let margin = actualHeight*0.02

        let perturbation = this.between(-margin, margin)
        
        let minY = actualHeight * (0.02  + i*0.01)
        let maxY = actualHeight * (0.98 - (this.state.rows - i) * 0.01)

        let perturbedY = this.bound(lastY + perturbation, minY, maxY)

        if (i > 0) {
          let lineAbovePoint = lines[i-1][j]

          if (perturbedY - lineAbovePoint.y < 0 || Math.abs(perturbedY - lineAbovePoint.y) < margin/3) {
            perturbedY = lineAbovePoint.y + margin
          }
        }

        perturbedY = this.bound(perturbedY, minY, maxY)
        
        lines[i][j] = {x: allXs[j], y: perturbedY}
        
        renderLines.push(
          <line key={`${i}-${j}`} x1={allXs[j-1]} y1={lines[i][j-1].y}
                x2={allXs[j]} y2={perturbedY} stroke={this.state.lineColor}
                 strokeWidth={this.state.strokeWidth} strokeLinecap="round" />
          )
      }
    }

    const circles = []
    const renderCircles = []

    for (let c = 0; c < this.state.rows - 1 + this.between(0, Math.min(this.state.rows*0.1, 2)); c++) {
      let added = false
      let shouldAdd = false

      while (!added) {
        const widerThanTall = actualWidth >= actualHeight

        const radius = widerThanTall ? this.between(actualWidth*0.02/2, actualHeight/this.state.rows) : this.between(actualWidth*0.02/2, actualWidth/this.state.columns);
        
        const circ = {
          x: this.between(actualWidth*0.01 + radius, actualWidth*0.99 - radius) ,
          y: this.between(actualHeight*0.01 + radius, actualHeight*0.99 - radius) ,
          r: radius
        }

        // no overlaps
        for (let circIndex = 0; circIndex < circles.length; circIndex++) {
          let testCirc = circles[circIndex];
          
          let distanceBetweenCenters = Math.sqrt(
            (testCirc.x - circ.x)*(testCirc.x - circ.x) + (testCirc.y - circ.y)*(testCirc.y - circ.y)
          )

          shouldAdd = distanceBetweenCenters > (testCirc.r + circ.r)

          if (!shouldAdd) {
            circIndex = circles.length;
          }
        }

        if (shouldAdd || circles.length === 0) {
          circles.push(circ)
          added = true

          renderCircles.push(
            <circle key={c} cx={circ.x}
                    cy={circ.y} r={radius}
                    fill={this.state.fillColor} stroke={this.state.lineColor}
                    strokeWidth={this.state.strokeWidth} fillOpacity={this.state.fillOpacity} />
          )
        }

      }
    }

    const renderHorizontalLines = []

    let randomNumberOfLines = (countMin, countMax, min, max) => {
      var lines = []
      
      for (let i=0; i < this.between(countMin, countMax); i ++) {
        lines.push(this.between(min, max))
      }

      return lines
    }

    let id = 0

    for (let rowIndex = 0; rowIndex < this.state.rows; rowIndex ++) {
      for (let colIndex = 0; colIndex < this.state.columns - 1; colIndex ++) {
        let bottomLeftCorner, topRightCorner, topLeftCorner, bottomRightCorner
        
        const chance = Math.random()

        // if not last row, chance we do a double row
        if (rowIndex !== this.state.rows-1) {
          
          topLeftCorner = rowIndex === 0 ? {x: allXs[colIndex], y: 0} : lines[rowIndex-1][colIndex]
          topRightCorner = rowIndex === 0 ? {x: allXs[colIndex+1], y: 0} : lines[rowIndex-1][colIndex+1]
          
          let secondLastRow = rowIndex + 1 === this.state.rows - 1
          let hasMoreRows = lines.hasOwnProperty(rowIndex+1)

          if (chance >= 0.85 && Math.random() > 0.7 && (hasMoreRows || secondLastRow)) {
            // double row straight line to bottom
            if (rowIndex + 1 === this.state.rows - 1) {
              bottomLeftCorner = {x: allXs[colIndex], y: actualHeight}
              bottomRightCorner = {x: allXs[colIndex+1], y: actualHeight}

            // double row to next row
            } else {
              bottomRightCorner = lines[rowIndex+1][colIndex + 1]
              bottomLeftCorner = lines[rowIndex+1][colIndex]
            }
          } else {
           bottomRightCorner = lines[rowIndex][colIndex + 1]
           bottomLeftCorner = lines[rowIndex][colIndex]
         }
        } else {
          bottomLeftCorner = {x: allXs[colIndex], y: actualHeight}
          bottomRightCorner = {x: allXs[colIndex+1], y: actualHeight}
          topLeftCorner = lines[rowIndex-1][colIndex]
          topRightCorner = lines[rowIndex-1][colIndex+1]
        }

        let bottomSlope = (bottomRightCorner.y - bottomLeftCorner.y)/(bottomRightCorner.x - bottomLeftCorner.x)
        let bottomIntercept = bottomRightCorner.y - bottomSlope * bottomRightCorner.x

        let topSlope = (topRightCorner.y - topLeftCorner.y)/(topRightCorner.x - topLeftCorner.x)
        let topIntercept = topRightCorner.y - topSlope * topRightCorner.x
        
        if (chance >= 0.85) {
          randomNumberOfLines(10/this.state.strokeWidth, 20/this.state.strokeWidth, allXs[colIndex], allXs[colIndex+1]).forEach(val => {
            renderHorizontalLines.push(
              <line key={id++} x1={val} y1={val*topSlope + topIntercept} x2={val} y2={val*bottomSlope + bottomIntercept}
                stroke={this.state.lineColor}  strokeWidth={this.state.strokeWidth} />
            )
          })
        } else if (chance >= 0.70) {
          randomNumberOfLines(15/this.state.strokeWidth, 25/this.state.strokeWidth, allXs[colIndex], allXs[colIndex+1]).forEach(val => {
            const val2 = this.between(allXs[colIndex], allXs[colIndex+1])
            
            const x1 = val
            const y1 = val*topSlope + topIntercept
            const x2 = val2
            const y2 = val2*bottomSlope + bottomIntercept

            renderHorizontalLines.push(
              <line key={id++} x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={this.state.lineColor}  strokeWidth={this.state.strokeWidth} />
            )
          })
        }
      }
    }

    const fillColor = tinycolor(this.state.fillColor)
    fillColor.setAlpha(this.state.fillOpacity)

    return (
      <div className="App" style={{ backgroundColor: this.state.backgroundColor}}>
        { this.state.displayColorPickers ? <div className="color-pickers">
          <ColorPicker color={tinycolor(this.state.backgroundColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({backgroundColor: color.hex}) } />
          <ColorPicker color={tinycolor(this.state.lineColor).toRgb()} disableAlpha={true}
            handleChange={ (color) => this.setState({lineColor: color.hex}) } />
          <ColorPicker color={fillColor.toRgb()} disableAlpha={false}
            handleChange={ (color) => {
                this.setState({fillColor: color.hex, fillOpacity: color.rgb.a}) 
              }
            } />
            </div> : null
        } 
        <div style={{ padding: this.state.padding }}> 
          <svg width={actualWidth} height={actualHeight}>
            <rect width={"100%"} height={"100%"}
              stroke={this.state.lineColor} fill={this.state.backgroundColor}
              strokeWidth={this.state.strokeWidth*3} />
            <g>
              {renderCircles}
            </g>
            <g>
              {renderLines}
            </g>
            <g>
              {renderHorizontalLines}
            </g>
          </svg>
        </div>
      </div>
    );
  }

  componentWillMount () {
    this.updateDimensions()
  }

  updateDimensions () {
    const w = window,
        d = document,
        documentElement = d.documentElement,
        body = d.getElementsByTagName('body')[0]
    
    const width = w.innerWidth || documentElement.clientWidth || body.clientWidth,
        height = w.innerHeight|| documentElement.clientHeight|| body.clientHeight

    //const dim = Math.min(width, height)

    const settings = { width: width , height: height }

    if (settings.width <= 500) {
      settings.padding = 20
    } else {
      settings.padding = 120
    }

    this.setState(settings)
  }

  componentWillUnmount () {
    window.removeEventListener("resize", this.updateDimensions.bind(this), true)
    window.removeEventListener('keydown', this.handleKeydown.bind(this), true)
    window.clearInterval(this.interval)
  }

  componentDidMount () {
    window.addEventListener("resize", this.updateDimensions.bind(this), true)
    window.addEventListener('keydown', this.handleKeydown.bind(this), true)

    this.interval = window.setInterval(this.tick.bind(this), 469)

    const mc = new Hammer(document, { preventDefault: true })

    mc.get('swipe').set({ direction: Hammer.DIRECTION_ALL })
    mc.get('pinch').set({ enable: true })

    mc.add(new Hammer.Tap({ event: 'tap', taps: 1 , pointers: 2}))

    mc.on("swipedown", ev => this.incrementRows())
      .on("swipeup", ev => this.decrementRows())
      .on("swipeleft", ev => this.incrementColumns())
      .on("swiperight", ev => this.decrementColumns())
      .on("pinchin", ev => { this.incrementColumns(); this.incrementRows();} )
      .on("pinchout", ev => { this.decrementColumns(); this.decrementRows();})
      .on('tap', ev => this.toggleRun())
  }

  handleKeydown (ev) {
    if (ev.which === 67 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.setState({displayColorPickers: !this.state.displayColorPickers})
    } else if (ev.which === 83 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.handleSave()
    } else if (ev.which === 82 && !(ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.forceUpdate()
    } else if (ev.which === 40 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.decrementStrokeWidth()
    } else if (ev.which === 40) {
      ev.preventDefault()
      this.decrementRows()
    } else if (ev.which === 38 && (ev.metaKey || ev.ctrlKey)) {
      ev.preventDefault()
      this.incrementStrokeWidth()
    } else if (ev.which === 38) {
      ev.preventDefault()
      this.incrementRows()
    } else if (ev.which === 37) {
      ev.preventDefault()
      this.decrementColumns()
    } else if (ev.which === 39) {
      ev.preventDefault()
      this.incrementColumns()
    } else if (ev.which === 84) {
      ev.preventDefault()
      this.toggleRun()
    }
  }

  handleSave () {
    const svgData = document.getElementsByTagName('svg')[0].outerHTML   
    const link = document.createElement('a')
    
    var svgBlob = new Blob([svgData], { type:"image/svg+xml;charset=utf-8" })
    var svgURL = URL.createObjectURL(svgBlob)
    link.href = svgURL 

    link.setAttribute('download', `klee.svg`)
    link.click()
  }
}


class ColorPicker extends React.Component {

  constructor (props) {
    super(props)

    this.state = {
      color: props.color,
      displayColorPicker: props.displayColorPicker,
      disableAlpha: props.disableAlpha
    }
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
    if (this.props.handleClose) {
      this.props.handleClose()
    }
  };

  handleChange = (color) => {
    this.setState({ color: color.rgb })
    this.props.handleChange(color)
  };

  render () {

    const styles = reactCSS({
      'default': {
        color: {
          background: this.state.disableAlpha ?
                `rgb(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b })` :
                `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b },  ${ this.state.color.a })`,
        },
        popover: {
          position: 'absolute',
          zIndex: '10',
        },
        cover: {
          position: 'fixed',
          top: '0px',
          right: '0px',
          bottom: '0px',
          left: '0px',
        },
      },
    })

    return (
      <div className='color-picker'>
        <div className='swatch' onClick={ this.handleClick }>
          <div className='color' style={ styles.color } />
        </div>
        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <div style={ styles.cover } onClick={ this.handleClose }/>
          <SketchPicker color={ this.state.color } onChange={ this.handleChange } disableAlpha={this.state.disableAlpha} />
        </div> : null }
      </div>
    )
  }
}

export default App;

// @flow

import * as React from 'react'
import {jss, jssKeyframes, colors, layout} from '../styles'
import {Sprite, SVG, TextBalloon} from '.'
import {Props as SpriteProps} from './Sprite'
import {Position, Direction} from '../program'
import {TextBalloon as TextBalloonType} from '../program'

export interface Props extends SpriteProps {
  failedPosition:     Position | null,
  direction:          Direction,
  transitionDuration: number,

  textBalloon: TextBalloonType,
  jumpForJoy:  boolean,
  shame:       boolean
}

export const defaultProps = {
  transitionDuration: 0,
  jumpForJoy:         false,
  shame:              false
}

interface State {
  failedPosition: Position | null,
  degrees:        number
}

export default class Rover extends React.Component<Props, State> {

  constructor(props: Props) {
    super(props)

    this.state = {
      failedPosition: null,
      degrees:        degreesForDirection(props.direction)
    }
  }

  //------
  // Failed simulation

  failedTimeout: number | null = null

  simulateFailed(props: Props) {
    if (this.failedTimeout != null) { return }

    const {failedPosition, transitionDuration} = props

    // Simulate a move that fails.
    this.setState({failedPosition})
    this.failedTimeout = setTimeout(() => {
      this.setState({failedPosition: null})
    }, transitionDuration * 0.2)
    setTimeout(() => {
      this.stopFailedSimulation()
    }, transitionDuration)
  }

  stopFailedSimulation() {
    if (this.failedTimeout != null) {
      clearTimeout(this.failedTimeout)
    }

    this.failedTimeout = null
    this.setState({failedPosition: null})
  }

  //------
  // Component lifecycle

  componentWillReceiveProps(props: Props) {
    if (props.direction !== this.props.direction) {
      this.setState({degrees: degreesForDirection(props.direction, this.props.direction, this.state.degrees)})
    }

    if (props.failedPosition != null) {
      this.simulateFailed(props)
    } else {
      this.stopFailedSimulation()
    }
  }

  render() {
    const {transitionDuration, jumpForJoy, shame, textBalloon} = this.props

    const position = this.state.failedPosition || this.props.position
    const spriteStyle = {
      transitionDuration: `${transitionDuration}ms`
    }
    const svgContainerStyle = {
      transform:          `rotateZ(${this.state.degrees}deg)`,
      transitionDuration: `${transitionDuration}ms`
    }

    return (
      <Sprite classNames={[$.robot]} position={position} style={spriteStyle}>
        <div classNames={[$.svgContainer, jumpForJoy && $.jumpingForJoy1]} style={svgContainerStyle}>
          <SVG classNames={[$.svg, shame && $.shaming, jumpForJoy && $.jumpingForJoy2]} name='robot'/>
        </div>
        {textBalloon && <TextBalloon balloon={textBalloon}/>}
      </Sprite>
    )
  }

}

function degreesForDirection(
  direction: Direction,
  existing: Direction = Direction.up,
  existingDegrees: number = 0
): number {
  return existingDegrees + directionDiff(existing, direction)
}

function directionDiff(from: Direction, to: Direction): number {
  switch (`${from}-${to}`) {
  case 'up-up': case 'right-right': case 'down-down': case 'left-left': return 0
  case 'up-right': case 'right-down': case 'down-left': case 'left-up': return 90
  case 'up-down': case 'right-left': case 'down-up': case 'left-right': return 180
  case 'up-left': case 'right-up': case 'down-right': case 'left-down': return -90
  default: return 0
  }
}

const rotateAnim = jssKeyframes('rotate', {
  '0%':   {transform: 'rotateZ(0)'},
  '100%': {transform: 'rotateZ(-360deg)'},
})

const scaleAnim = jssKeyframes('scale', {
  '0%':   {transform: 'scale(1)', animationTimingFunction: 'ease-out'},
  '50%':  {transform: 'scale(2)', fill: colors.green.string(), animationTimingFunction: 'ease-in'},
  '100%': {transform: 'scale(1)'},
})

const shameAnim = jssKeyframes('shame', {
  '0%':   {transform: 'scale(1)', animationTimingFunction: 'ease-out'},
  '50%':  {transform: 'scale(0.8)', fill: colors.red.string(), animationTimingFunction: 'ease-in'},
  '100%': {transform: 'scale(1)'},
})

const $ = jss({
  robot: {
    ...layout.transition(['top', 'left', 'transform'], 0)
  },

  svgContainer: {
    ...layout.overlay,
    ...layout.flex.center,
  },

  svg: {
    width:  '88%',
    height: '88%',
    fill:   colors.fg.normal
  },

  shaming: {
    animation: `${shameAnim} linear 1s infinite`
  },

  jumpingForJoy1: {
    animation: `${rotateAnim} linear 1s infinite`
  },

  jumpingForJoy2: {
    animation: `${scaleAnim} linear 1s infinite`
  }
})
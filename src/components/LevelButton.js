// @flow

import React from 'react'
import {observer} from 'mobx-react'
import {jss, colors} from '../styles'
import {Button, ScoreStars} from '.'
import {levelStore} from '../stores'
import type {Level} from '../stores'
import type Color from 'color'

export type Props = {
	level:    Level,
	number:   number,
	small?:   boolean,
	color:    Color
}

export const defaultProps = {
	color: colors.purple
}

@observer
export default class LevelButton extends React.Component<*, Props, *> {

	props: Props
	static defaultProps = defaultProps

	render() {
		const {level, number, small} = this.props
		const score = levelStore.levelScores.get(level.id)
		const starSize = small ? 10 : 15
		const selectable = levelStore.isLevelSelectable(level)

		const color = level === levelStore.currentLevel
			? colors.green
			: this.props.color

		return (
			<Button
				label={number.toString()}
				small={small}
				color={color}
				disabled={!selectable}
				onTap={this.onTap}
			>
				<ScoreStars score={score || 0} starSize={starSize} padding={starSize * 0.4} showGray animated={false}/>
			</Button>
		)
	}

	onTap = () => {
		const {level} = this.props
		levelStore.loadLevel(level.id)
	}

}

const $ = jss({
})
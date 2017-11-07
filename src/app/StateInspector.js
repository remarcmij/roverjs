// @flow

import React from 'react'
import {observer} from 'mobx-react'
import {jss, layout, presets} from '../styles'
import {CodeMirror} from '../components/codemirror'
import type {ProgramState} from '../program'

export type Props = {
	state: ProgramState
}

@observer
export default class StateInspector extends React.Component<*, Props, *> {

	props: Props

	shouldDisplayProperty(key: string) {
		const desc = Object.getOwnPropertyDescriptor(this.props.state, key)
		return desc != null && desc.visible !== false
	}

	render() {
		return (
			<div className={$.stateInspector}>
				{this.renderHeader()}
				{this.renderCodeMirror()}
			</div>
		)
	}

	renderHeader() {
		return (
			<div className={$.header}>
				State
			</div>
		)
	}

	renderCodeMirror() {
		const {state} = this.props
		const replacer = (k, v) => this.shouldDisplayProperty(k) ? v : null
		const json = JSON.stringify(state, replacer, 2)

		return (
			<CodeMirror
				className={$.codeMirror}
				mode={{name: 'javascript', json: true}}
				value={json}
				theme='zenburn'
				options={{lineNumbers: false, readOnly: true}}
			/>
		)
	}

}

const $ = jss({
	stateInspector: {
		...layout.overlay,
		...layout.flex.column
	},

	header: {
		...presets.panelHeader,
		position:     'relative',
		marginTop:    -4,
	},

	codeMirror: {
		flex: [1, 0, 0],
		...layout.flex.column
	}
})
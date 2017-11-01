// @flow

import React from 'react'
import {observer} from 'mobx-react'
import {CodeMirror, Marker, Gutter, GutterMarker, LineWidget, LineClass} from './codemirror'
import {jss, jssKeyframes, colors, layout, fonts} from '../styles'
import {programStore, simulatorStore} from '../stores'
import type {ASTNodeLocation} from '../program'
import type CodeMirrorEl from 'codemirror'

import 'codemirror/mode/javascript/javascript'

export type Props = {
	className?: ClassNameProp
}

type State = {
	focusedErrorLine: ?number,
	readOnlyRanges:   Array<{start: number, end: number}>,
	codeMirror:       ?CodeMirrorEl,
}

@observer
export default class CodeEditor extends React.Component<*, Props, *> {

	props: Props

	state: State = {
		focusedErrorLine: null,
		readOnlyRanges:   [],
		codeMirror:       null
	}

	editor: ?Editor

	//------
	// Methods

	toggleFocusedErrorLine(line: number) {
		if (this.state.focusedErrorLine === line) {
			this.setState({focusedErrorLine: null})
		} else {
			this.setState({focusedErrorLine: line})
		}
	}

	//------
	// Read only

	updateReadOnlyRanges(code: string, codeMirror: CodeMirrorEl) {
		this.setState({readOnlyRanges: this.calculateReadOnlyRanges(code, codeMirror)})
	}

	calculateReadOnlyRanges(code: string, codeMirror: CodeMirrorEl): Array<{start: number, end: number}> {
		const ranges = []

		let start = 0
		while ((start = code.indexOf('----', start)) !== -1) {
			let end = code.indexOf('++++', start)
			if (end === -1) { end = code.length }

			const startLine = codeMirror.posFromIndex(start).line
			const endLine   = codeMirror.posFromIndex(end).line
			ranges.push({start: startLine, end: endLine})

			start = end + 1
		}

		return ranges
	}

	get readOnlyLines(): number[] {
		const lines = new Set()
		for (const {start, end} of this.state.readOnlyRanges) {
			for (let line = start; line <= end; line++) {
				lines.add(line)
			}
		}
		return Array.from(lines)
	}

	//------
	// Rendering

	componentWillReact() {
		// this.setState({readOnlyRanges: this.calculateReadOnlyRanges()})
	}

	render() {
		const {className} = this.props
		const hasErrors = programStore.errors.length > 0

		return (
			<CodeMirror
				ref={el => { this.editor = el }}
				className={[$.codeEditor, hasErrors && $.withErrors, className]}
				mode='javascript'
				value={programStore.code}
				onChange={this.onEditorChange.bind(this)}

				onCodeMirrorSetUp={cm => { this.setState({codeMirror: cm}) }}
				onValueSet={this.onValueSet}

				options={{
					cursorScrollMargin: 50
				}}
			>
				{this.renderCurrentStepMarker()}
				{this.renderErrorMarkers()}
				{this.renderFocusedErrorLineWidgets()}
				{this.renderReadOnlyMarkers()}
				{this.renderReadOnlyLineClasses()}

				<Gutter name='errors'>
					{this.renderErrorGutterMarkers()}
				</Gutter>
			</CodeMirror>
		)
	}

	//------
	// Current line

	renderCurrentStepMarker() {
		const {currentStep, stepSuccess} = simulatorStore
		if (currentStep == null) { return null }

		return (
			<Marker
				from={{line: currentStep.start.line, ch: currentStep.start.column}}
				to={{line: currentStep.end.line, ch: currentStep.end.column}}
				className={stepSuccess ? $.currentStepSuccess : $.currentStepFailure}
			/>
		)
	}

	renderReadOnlyMarkers() {
		return this.state.readOnlyRanges.map(({start, end}) => (
			<Marker
				key={`readonly-${start}-${end}`}
				from={{line: start, ch: 0}}
				to={{line: end + 1, ch: 0}}
				options={{readOnly: true}}
			/>
		))
	}

	renderReadOnlyLineClasses() {
		return this.readOnlyLines.map(line => (
			<LineClass
				key={`readonly-${line}`}
				line={line}
				className={$.readOnlyLine}
			/>
		))
	}

	//------
	// Errors

	renderErrorMarkers() {
		return programStore.errors.map((error, index) => {
			return this.renderErrorMarker(error, index)
		})
	}

	renderErrorMarker(error: CodeError, index: number) {
		const {start, end, empty} = getErrorLocation(error)
		if (start == null) { return null }

		return (
			<Marker
				key={index}
				from={{line: start.line, ch: start.column}}
				to={{line: end.line, ch: empty ? end.column + 1 : end.column}}
				className={[$.errorMarker, empty && $.emptyErrorMarker]}
			/>
		)
	}

	renderErrorGutterMarkers() {
		const lines = new Set()
		for (const error of programStore.errors) {
			const {start, end} = getErrorLocation(error)
			if (start == null) { continue }

			for (let ln = start.line; ln <= end.line; ln++) {
				lines.add(ln)
			}
		}

		return Array.from(lines).map(line => {
			return (
				<GutterMarker
					key={line}
					line={line}
					className={$.errorGutterMarker}
					onTap={this.onErrorGutterMarkerTap.bind(this, line)}
				/>
			)
		})
	}

	renderFocusedErrorLineWidgets() {
		const {focusedErrorLine: line} = this.state
		if (line == null) { return null }

		const errors = programStore.errors.filter(err => {
			const {start, end} = getErrorLocation(err)
			if (start == null) { return false }

			return start.line <= line && end.line >= line
		})
		return errors.map((error, index) => {
			return (
				<LineWidget key={`${line}-${index}`} line={line} className={$.errorLineWidget}>
					<div>{error.message}</div>
				</LineWidget>
			)
		})
	}

	//------
	// Events

	onEditorChange = (value: string) => {
		programStore.code = value
		programStore.errors = []

		if (this.state.codeMirror != null) {
			this.updateReadOnlyRanges(value, this.state.codeMirror)
		}
	}

	onValueSet = (value: string, codeMirror: ?CodeMirrorEl) => {
		this.updateReadOnlyRanges(value, codeMirror)
	}

	onErrorGutterMarkerTap = (line: number) => {
		this.toggleFocusedErrorLine(line)
	}

}

function getErrorLocation(error: CodeError): {start: ASTNodeLocation, end: ASTNodeLocation} {
	const {loc} = error
	if (loc == null) { return {start: null, end: null} }

	let start: ASTNodeLocation
	let end: ASTNodeLocation
	if (loc.start != null) {
		start = loc.start
		end   = loc.end
	} else {
		start = loc
		end   = loc
	}

	const empty = start.line === end.line && start.column === end.column

	start = {line: start.line - 1, column: start.column}
	end = {line: end.line - 1, column: end.column}

	return {start, end, empty}
}

const errorAnim = jssKeyframes('error', {
	'0%':   {animationTimingFunction: 'ease-out'},
	'50%':  {backgroundColor: colors.red.alpha(0.05).string(), animationTimingFunction: 'ease-in'},
	'100%': {},
})

const $ = jss({
	codeEditor: {
		...layout.flex.column,

		'& .CodeMirror-gutter.errors': {
			width: 12
		},
	},

	withErrors: {
		'& .CodeMirror': {
			animation: `${errorAnim} 1s linear infinite`
		}
	},

	currentStepSuccess: {
		background: colors.green
	},

	currentStepFailure: {
		background: colors.red
	},

	readOnlyLine: {
		backgroundColor: colors.black.alpha(0.2)
	},

	errorGutterMarker: {
		width:        10,
		height:       10,
		borderRadius: 5,

		border:      [1, 'solid', 'white'],
		background:  colors.red,

		cursor: 'pointer'
	},

	errorMarker: {
		background:   colors.red.alpha(0.1),
		borderBottom: [1, 'dashed', colors.red]
	},

	emptyErrorMarker: {
		position:     'relative',
		background:   'none',
		borderBottom: 'none',

		// Make a small triangle.
		'&::after': {
			position: 'absolute',
			display:  'block',
			content:  '""',

			left:     -4,
			bottom:   -1,
			width:    0,
			height:   0,

			border:            [4, 'solid', colors.transparent],
			borderBottomColor: colors.red
		}
	},

	errorLineWidget: {
		border:      [1, 'solid', colors.red],
		borderWidth: `1px 0`,
		background:  colors.red.alpha(0.6),
		color:       colors.contrast(colors.red),
		font:        fonts.normal,
		padding:     [2, layout.padding.s]
	}
})
import EventEmitter from 'events'
import {observable, autorun, action} from 'mobx'
import {Program, ProgramBuilder, Level, CodeError} from '../program'
import {simulatorStore} from '.'

export default class ProgramStore extends EventEmitter {

  constructor() {
    super()
    autorun(() => { this.saveCode() })
  }

  @observable
  level: Level | null = null

  @observable
  code: string = ''

  @observable
  program: Program | null = null

  @observable
  errors: CodeError[] = []

  @observable
  hasInfiniteLoop: boolean = false

  @action
  loadLevel(level: Level) {
    this.level = level
    this.loadCode()
  }

  loadCode() {
    const {level} = this
    if (level == null) { return }

    const codes = JSON.parse(window.localStorage.codes || '{}')
    this.code = codes[level.id]
    if (this.code == null) {
      this.code = level.initialCode
    }

    simulatorStore.reset()
    this.errors = []
    this.program = null
    this.hasInfiniteLoop = false
  }

  saveCode() {
    if (this.level == null) { return }

    const codes = JSON.parse(window.localStorage.codes || '{}')
    codes[this.level.id] = this.code
    window.localStorage.codes = JSON.stringify(codes)
  }

  @action
  resetCode() {
    if (this.level == null) { return }
    this.code = this.level.initialCode
  }

  @action
  runAndSimulate(firstStepOnly: boolean = false) {
    // In the (non deterministic) levels with keys, there is a chance that users will accidentally
    // open a lock without implementing the right algorithm. So, we 'cheat' a little by running
    // the program 50 times. If any of them fail, we show the failed simulation.

    // In deterministic levels, this will not be very useful, but it's not a problem either.
    const success = this.runProgram(firstStepOnly)

    // Prepare for simulation.
    simulatorStore.reset()

    // If successful, run a simulation of the created program.
    if (this.program != null && success) {
      simulatorStore.simulate(this.program, firstStepOnly)
    } else {
      this.emit('error')
    }
  }

  @action
  runProgram(firstStepOnly: boolean = false) {
    if (this.level == null) { return false }
    if (simulatorStore.active) { return false }

    // Create a new program.
    const program = this.program = new Program(this.level, this.code)

    // Use the students code to build the program.
    const builder = new ProgramBuilder(program)

    try {
      const success = builder.build(this.code)
      this.hasInfiniteLoop = false
      this.errors = builder.errors

      return success
    } catch (error) {
      if (error.name === 'InfiniteLoopException') {
        this.hasInfiniteLoop = true
        return false
      } else {
        throw error
      }
    }
  }

}
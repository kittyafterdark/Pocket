import {test,expect} from 'bun:test'
import {timeskipMinutes,timeskipLabel,normalizeTimeskip} from '../src/domain/timeskip.js'

test('timeskip accepts bounded positive whole minutes and labels mixed durations',()=>{
  expect(timeskipLabel(1561)).toBe('1 day 2 hours 1 minute later')
  expect(timeskipLabel(120)).toBe('2 hours later')
  for(const value of [0,-1,1.5,Infinity,'60',525601])expect(()=>timeskipMinutes(value)).toThrow()
  expect(normalizeTimeskip({minutes:60})).toEqual({minutes:60})
  expect(normalizeTimeskip({minutes:-5})).toBeUndefined()
})

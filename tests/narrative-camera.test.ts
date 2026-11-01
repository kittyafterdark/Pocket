import {expect,test} from 'bun:test'
import {defaultPreferences,normalizePreferences} from '../src/domain/preferences.js'
import {narrativeCameraGuidance,narrativePhotoMarkdown} from '../src/domain/narrative-camera.js'

test('narrative photo generation is opt-in and inline choice remains saved independently',()=>{
 const defaults=defaultPreferences();expect(defaults.captureNarrativePhotos).toBe(false);expect(defaults.inlineNarrativePhotos).toBe(false)
 expect(normalizePreferences({captureNarrativePhotos:'true',inlineNarrativePhotos:1}).captureNarrativePhotos).toBe(false)
 const saved=normalizePreferences({captureNarrativePhotos:false,inlineNarrativePhotos:true});expect(saved.inlineNarrativePhotos).toBe(true)
 expect(narrativePhotoMarkdown({imageId:'image',imageUrl:'/api/v1/images/image'},saved)).toBeUndefined()
})

test('enabled guidance explicitly includes private camera-roll photos without sending messages',()=>{
 const settings={captureNarrativePhotos:true,inlineNarrativePhotos:true},guidance=narrativeCameraGuidance(settings)
 expect(guidance).toContain('payload.narrative=true');expect(guidance).toContain('REQUIRED');expect(guidance).toContain('hidden folder');expect(guidance).toContain('no message being sent');expect(guidance).toContain('imageMarkdown')
 expect(narrativeCameraGuidance({...settings,inlineNarrativePhotos:false})).toContain('do not insert image Markdown')
 expect(narrativeCameraGuidance({...settings,captureNarrativePhotos:false})).toContain('only for an explicit image-generation request')
})

test('inline photos use only the current generated image and cannot inject Markdown through the URL',()=>{
 const settings={captureNarrativePhotos:true,inlineNarrativePhotos:true}
 expect(narrativePhotoMarkdown({imageId:'fresh',imageUrl:'/api/v1/images/fresh'},settings)).toBe('![Narrative photo](</api/v1/images/fresh>)')
 for(const imageUrl of ['javascript:bad','//elsewhere/image','https://example.com/image>\n[bad](https://example.com)'])expect(narrativePhotoMarkdown({imageId:'fresh',imageUrl},settings)).toBeUndefined()
 expect(narrativePhotoMarkdown({imageId:'',imageUrl:'/api/v1/images/old'},settings)).toBeUndefined()
 expect(narrativePhotoMarkdown({imageId:'fresh',imageUrl:'/api/v1/images/fresh'},{...settings,inlineNarrativePhotos:false})).toBeUndefined()
})

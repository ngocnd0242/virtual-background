import { createStyles, makeStyles, Theme } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'
import { BodyPix } from '@tensorflow-models/body-pix'
import React, { useEffect, useCallback } from 'react'
import { BackgroundConfig } from '../helpers/backgroundHelper'
import { PostProcessingConfig } from '../helpers/postProcessingHelper'
import { SegmentationConfig } from '../helpers/segmentationHelper'
import { SourcePlayback } from '../helpers/sourceHelper'
import useRenderingPipeline from '../hooks/useRenderingPipeline'
import { TFLite } from '../hooks/useTFLite'
import recorder from 'react-canvas-recorder'

type OutputViewerProps = {
  sourcePlayback: SourcePlayback
  backgroundConfig: BackgroundConfig
  segmentationConfig: SegmentationConfig
  postProcessingConfig: PostProcessingConfig
  bodyPix: BodyPix
  tflite: TFLite
}

function OutputViewer(props: OutputViewerProps) {
  const classes = useStyles()
  const {
    pipeline,
    backgroundImageRef,
    canvasRef,
    fps,
    durations: [resizingDuration, inferenceDuration, postProcessingDuration],
  } = useRenderingPipeline(
    props.sourcePlayback,
    props.backgroundConfig,
    props.segmentationConfig,
    props.bodyPix,
    props.tflite
  )

  useEffect(() => {
    if (pipeline) {
      pipeline.updatePostProcessingConfig(props.postProcessingConfig)
    }
  }, [pipeline, props.postProcessingConfig])

  const statDetails = [
    `resizing ${resizingDuration}ms`,
    `inference ${inferenceDuration}ms`,
    `post-processing ${postProcessingDuration}ms`,
  ]
  const stats = `${Math.round(fps)} fps (${statDetails.join(', ')})`

  const getFilename = () => {
    const d = new Date()
    return `sun_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.mp4`
  }

  const download = (file: Blob) => {
    const videoURL = URL.createObjectURL(file)
    const tag = document.createElement('a')
    tag.href = videoURL
    tag.download = getFilename()
    document.body.appendChild(tag)
    tag.click()
    document.body.removeChild(tag)
  }

  const startRecording = useCallback(() => {
    recorder.createStream(canvasRef.current)
    recorder.start()
  }, [canvasRef])

  const stopRecording = useCallback(() => {
    recorder.stop()
    const file = recorder.save()
    download(file)
  }, [])
  return (
    <div className={classes.root}>
      <div>
        <button onClick={startRecording}>Start Recording</button>
        <button onClick={stopRecording}>Stop Recording & Download video</button>
      </div>
      {props.backgroundConfig.type === 'image' && (
        <img
          ref={backgroundImageRef}
          className={classes.render}
          src={props.backgroundConfig.url}
          alt=""
          hidden={props.segmentationConfig.pipeline === 'webgl2'}
        />
      )}

      <canvas
        // The key attribute is required to create a new canvas when switching
        // context mode
        key={props.segmentationConfig.pipeline}
        ref={canvasRef}
        style={{marginTop: '30px'}}
        className={classes.render}
        width={props.sourcePlayback.width}
        height={props.sourcePlayback.height}
      />
      <Typography className={classes.stats} style={{marginTop: '30px'}} variant="caption">
        {stats}
      </Typography>
    </div>
  )
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flex: 1,
      position: 'relative',
    },
    render: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    },
    stats: {
      position: 'absolute',
      top: 0,
      right: 0,
      left: 0,
      textAlign: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.48)',
      color: theme.palette.common.white,
    },
  })
)

export default OutputViewer

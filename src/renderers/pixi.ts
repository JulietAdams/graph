import * as PIXI from 'pixi.js'
import { Viewport } from 'pixi-viewport'
// import * as GStats from 'gstats'
import { Options, DEFAULT_OPTIONS, DEFAULT_NODE_STYLES, DEFAULT_EDGE_STYLES } from './options'
import { Edge, Node, Graph, PositionedNode, PositionedEdge } from '../index'
import { throttleAnimationFrame } from '../utils'
import { edgeStyleSelector, nodeStyleSelector, pixiFrameRate } from './utils'
import { color } from 'd3-color'


const colorToNumber = (colorString: string): number => {
  const c = color(colorString)
  if (c === null) {
    return 0x000000
  }

  return parseInt(c.hex().slice(1), 16)
}


export const PixiRenderer = ({
  id,
  tick = DEFAULT_OPTIONS.tick,
  nodeStyles = {},
  edgeStyles = {},
}: Options) => {
  const container = document.getElementById(id)
  if (container === null) {
    throw new Error(`Element #${id} not found`)
  }

  const NODE_STYLES = { ...DEFAULT_NODE_STYLES, ...nodeStyles }
  const EDGE_STYLES = { ...DEFAULT_EDGE_STYLES, ...edgeStyles }
  const nodeWidthSelector = nodeStyleSelector(NODE_STYLES, 'width')
  const nodeStrokeWidthSelector = nodeStyleSelector(NODE_STYLES, 'strokeWidth')
  const nodeFillSelector = nodeStyleSelector(NODE_STYLES, 'fill')
  const nodeStrokeSelector = nodeStyleSelector(NODE_STYLES, 'stroke')
  const nodeFillOpacitySelector = nodeStyleSelector(NODE_STYLES, 'fillOpacity')
  const nodeStrokeOpacitySelector = nodeStyleSelector(NODE_STYLES, 'strokeOpacity')
  const edgeStrokeSelector = edgeStyleSelector(EDGE_STYLES, 'stroke')
  const edgeWidthSelector = edgeStyleSelector(EDGE_STYLES, 'width')
  const edgeStrokeOpacitySelector = edgeStyleSelector(EDGE_STYLES, 'strokeOpacity')

  const SCREEN_WIDTH = container.offsetWidth
  const SCREEN_HEIGHT = container.offsetHeight
  const WORLD_WIDTH = SCREEN_WIDTH * 2
  const WORLD_HEIGHT = SCREEN_HEIGHT * 2
  const RESOLUTION = window.devicePixelRatio * 2
  const LABEL_FONT_FAMILY = 'Helvetica'
  const LABEL_FONT_SIZE = 12
  const LABEL_TEXT = (node: PositionedNode) => node.id
  const LABEL_X_PADDING = 2
  const LABEL_Y_PADDING = 1

  const app = new PIXI.Application({
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    resolution: RESOLUTION,
    transparent: true,
    antialias: true,
    autoStart: false
  })

  app.view.style.width = `${SCREEN_WIDTH}px`

  const render = throttleAnimationFrame(() => app.render())
  
  const viewport = new Viewport({
    screenWidth: SCREEN_WIDTH,
    screenHeight: SCREEN_HEIGHT,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    interaction: app.renderer.plugins.interaction
  })

  // pixiFrameRate(viewport)
  // var pixiHooks = new GStats.PIXIHooks(app)
  // var stats = new GStats.StatsJSAdapter(pixiHooks)
  // document.body.appendChild(stats.stats.dom || stats.stats.domElement)
  // app.ticker.add(stats.update)

	app.stage.addChild(
    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      // this seems weirdly slow...
      .on('frame-end' as any, throttleAnimationFrame(() => { // TODO - typings?
        if (viewport.dirty) {
          app.render()
          viewport.dirty = false
        }
      }))
  )

  viewport.center = new PIXI.Point(WORLD_WIDTH / 6, WORLD_HEIGHT / 6)
  viewport.setZoom(0.5, true)


  const linksLayer = new PIXI.Graphics()
  let nodesLayer = new PIXI.Container() // Graphics vs Container layer?
  // const nodesLayer = new PIXI.Graphics()
  const labelsLayer = new PIXI.Container()
  const frontLayer = new PIXI.Container()
  viewport.addChild(linksLayer)
  viewport.addChild(nodesLayer)
  viewport.addChild(labelsLayer)
  viewport.addChild(frontLayer)

  // does PIXI have better mechanisms for lookups?
  const nodesById: { [key: string]: { node: PositionedNode, nodeGfx: PIXI.Container, labelGfx: PIXI.Container} } = {}
  let hoveredNode: PositionedNode | undefined
  let clickedNode: PositionedNode | undefined


  // prevent body scrolling
  app.view.addEventListener('wheel', (event) => { event.preventDefault() })

  container.appendChild(app.view)

  const hoverNode = (event: PIXI.interaction.InteractionEvent) => {
    const node = nodesById[event.currentTarget.name].node
    if (clickedNode !== undefined) {
      return
    }

    if (hoveredNode === node) {
      return
    }
    
    hoveredNode = node
    const radius = nodeWidthSelector(node) / 2
    
    const nodeGfx = nodesById[node.id].nodeGfx
    const labelGfx = nodesById[node.id].labelGfx

    nodesLayer.removeChild(nodeGfx)
    frontLayer.addChild(nodeGfx)
    labelsLayer.removeChild(labelGfx)
    frontLayer.addChild(labelGfx)

    const circleBorder = new PIXI.Graphics()
    circleBorder.name = 'hoverBorder'
    circleBorder.x = 0
    circleBorder.y = 0
    circleBorder.lineStyle(nodeStrokeWidthSelector(node), 0x000000)
    circleBorder.drawCircle(0, 0, radius)
    nodeGfx.addChild(circleBorder)
    
    render()
  }

  const unhoverNode = (event: PIXI.interaction.InteractionEvent) => {
    const node = nodesById[event.currentTarget.name].node
    if (clickedNode) {
      return
    }
    if (hoveredNode !== node) {
      return
    }
    
    hoveredNode = undefined
    
    const nodeGfx = nodesById[node.id].nodeGfx
    const labelGfx = nodesById[node.id].labelGfx
    
    frontLayer.removeChild(nodeGfx)
    nodesLayer.addChild(nodeGfx)
    frontLayer.removeChild(labelGfx)
    labelsLayer.addChild(labelGfx)

    nodeGfx.removeChild(nodeGfx.getChildByName('hoverBorder'))
    
    render()
  }

  const clickNode = (event: PIXI.interaction.InteractionEvent) => {
    clickedNode = nodesById[event.currentTarget.name].node
    app.renderer.plugins.interaction.on('mousemove', appMouseMove)
    viewport.pause = true
  }

  const unclickNode = () => {
    clickedNode = undefined
    app.renderer.plugins.interaction.off('mousemove', appMouseMove)
    viewport.pause = false
  }

  const appMouseMove = (event: any) => {
    if (!clickedNode) {
      return
    }

    const { x, y } = viewport.toWorld(event.data.global)
    clickedNode.x = x
    clickedNode.y = y
    
    updatePositions()
  }

  let nodes: PositionedNode[]
  let edges: PositionedEdge[]

  const updatePositions = () => {
    linksLayer.clear()
    linksLayer.alpha = 0.6

    edges.forEach((edge) => {
      linksLayer.lineStyle(1, 0x999999)
      linksLayer.moveTo(edge.source.x!, edge.source.y!)
      linksLayer.lineTo(edge.target.x!, edge.target.y!)
    })
    linksLayer.endFill()

    // TODO - split into add/update/remove nodes, updateEdges, then call render()
    nodes.forEach((node) => {
      const nodeGfx = nodesById[node.id].nodeGfx
      const labelGfx = nodesById[node.id].labelGfx
      // is the below necessary
      nodeGfx.position = new PIXI.Point(node.x, node.y)
      labelGfx.position = new PIXI.Point(node.x, node.y)
    })
    
    render()
  }


  const graph = new Graph(({ nodes: nodeMap, edges: edgeMap }) => {
    nodes = Object.values(nodeMap)
    edges = Object.values(edgeMap)

    nodes.forEach((node) => {
      if (nodesById[node.id] !== undefined) {
        nodesById[node.id] = { ...nodesById[node.id], node }
        return
      }

      const radius = nodeWidthSelector(node) / 2

      const nodeGfx = new PIXI.Container()
      nodeGfx.name = node.id
      nodeGfx.x = node.x!
      nodeGfx.y = node.y!
      nodeGfx.interactive = true
      nodeGfx.buttonMode = true
      nodeGfx.hitArea = new PIXI.Circle(0, 0, radius + 5)
      nodeGfx.on('mouseover', hoverNode)
      nodeGfx.on('mouseout', unhoverNode)
      nodeGfx.on('mousedown', clickNode)
      nodeGfx.on('mouseup', unclickNode)
      nodeGfx.on('mouseupoutside', unclickNode)

      const circle = new PIXI.Graphics()
      circle.x = 0
      circle.y = 0
      circle.beginFill(colorToNumber(nodeFillSelector(node)))
      circle.alpha = nodeFillOpacitySelector(node)
      circle.drawCircle(0, 0, radius)
      nodeGfx.addChild(circle)

      const circleBorder = new PIXI.Graphics()
      circle.x = 0
      circle.y = 0
      circleBorder.lineStyle(nodeStrokeWidthSelector(node), colorToNumber(nodeStrokeSelector(node)))
      circleBorder.drawCircle(0, 0, radius)
      nodeGfx.addChild(circleBorder)

      // TODO - don't render label if doesn't exist
      const labelGfx = new PIXI.Container()
      labelGfx.x = node.x!
      labelGfx.y = node.y!
      labelGfx.interactive = true
      labelGfx.buttonMode = true

      const labelText = new PIXI.Text(node.label || '', {
        fontFamily: LABEL_FONT_FAMILY,
        fontSize: LABEL_FONT_SIZE,
        fill: 0x333333,
        lineJoin: "round",
        stroke: "#fafafaee",
        strokeThickness: 2,
      })
      labelText.x = 0
      labelText.y = radius + 5 + LABEL_Y_PADDING
      labelText.anchor.set(0.5, 0)
      labelGfx.addChild(labelText)

      nodesLayer.addChild(nodeGfx)
      labelsLayer.addChild(labelGfx)

      nodeGfx.position = new PIXI.Point(node.x, node.y)
      labelGfx.position = new PIXI.Point(node.x, node.y)

      nodesById[node.id] = { node, nodeGfx, labelGfx }
    })

    updatePositions()
  })


  return (nodes: { [key: string]: Node }, edges: { [key: string]: Edge }) => {
    graph.layout({ nodes, edges, options: { tick } })
  }
}

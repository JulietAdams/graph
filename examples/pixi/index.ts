import Stats from 'stats.js'
import * as Force from '../../src/layout/force'
import * as SubGraph from '../../src/layout/subGraph'
import * as Zoom from '../../src/controls/zoom'
import { Node, Edge } from '../../src/'
import { NodeStyle, Renderer, RendererOptions } from '../../src/renderers/pixi'


export const stats = new Stats()
stats.showPanel(0) // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom)


/**
 * Initialize Data
 */
const createCompanyStyle = (radius: number): Partial<NodeStyle> => ({
  color: '#FFAF1D',
  stroke: [{
    color: '#FFF',
    width: 4,
  }, {
    color: '#F7CA4D',
  }],
  icon: { type: 'textIcon' as const, family: 'Material Icons', text: 'business', color: '#fff', size: radius * 1.2 },
  badge: [{
    position: 45,
    color: '#FFAF1D',
    stroke: '#FFF',
    icon: {
      type: 'textIcon',
      family: 'Helvetica',
      size: 10,
      color: '#FFF',
      text: '15',
    }
  }, {
    position: 135,
    color: '#E4171B',
    stroke: '#FFF',
    icon: {
      type: 'textIcon',
      family: 'Helvetica',
      size: 10,
      color: '#FFF',
      text: '!',
    }
  }],
})

const createPersonStyle = (radius: number): Partial<NodeStyle> => ({
  color: '#7CBBF3',
  stroke: [{
    color: '#90D7FB',
    width: 2,
  }],
  icon: { type: 'textIcon' as const, family: 'Material Icons', text: 'person', color: '#fff', size: radius * 1.2 },
  badge: [{
    position: 45,
    color: '#7CBBF3',
    stroke: '#FFF',
    icon: {
      type: 'textIcon',
      family: 'Helvetica',
      size: 10,
      color: '#FFF',
      text: '8',
    }
  }],
})

const createSubgraphStyle = (radius: number): Partial<NodeStyle> => ({
  color: '#FFAF1D',
  stroke: [{ color: '#F7CA4D', width: 6 }],
  icon: { type: 'textIcon' as const, family: 'Material Icons', text: 'business', color: '#fff', size: radius * 1.2 }
})

let nodes = [
  { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' }, { id: 'd', label: 'D' }, { id: 'e', label: 'E' }, { id: 'f', label: 'F' }, { id: 'g', label: 'G' },
  { id: 'h', label: 'H' }, { id: 'i', label: 'I' }, { id: 'j', label: 'J' }, { id: 'k', label: 'K' }, { id: 'l', label: 'L' }, { id: 'm', label: 'M' }, { id: 'n', label: 'N' },
  { id: 'o', label: 'O' }, { id: 'p', label: 'P' }, { id: 'q', label: 'Q' },
]
  .map<Node>(({ id, label }) => ({
    id,
    label,
    radius: 18,
    style: id === 'a' ? createCompanyStyle(18) : createPersonStyle(18)
  }))

let edges: Edge[] = [
  { id: 'ba', source: 'a', target: 'b', label: 'None' }, { id: 'ca', source: 'a', target: 'c', label: 'None' }, { id: 'da', source: 'a', target: 'd', label: 'None' },
  { id: 'ea', source: 'a', target: 'e', label: 'A to E', style: { arrow: 'forward' } }, { id: 'fa', source: 'a', target: 'f', label: 'A to F', style: { arrow: 'forward' } },
  { id: 'ga', source: 'a', target: 'g', label: 'A to G', style: { arrow: 'forward' } }, { id: 'ha', source: 'a', target: 'h', label: 'A to H', style: { arrow: 'forward' } },
  { id: 'ia', source: 'a', target: 'i', label: 'A to I', style: { arrow: 'forward' } }, { id: 'ja', source: 'b', target: 'j', label: 'B to J', style: { arrow: 'forward' } },
  { id: 'ka', source: 'b', target: 'k', label: 'K to B', style: { arrow: 'reverse' } }, { id: 'la', source: 'b', target: 'l', label: 'L to B', style: { arrow: 'reverse' } },
  { id: 'ma', source: 'l', target: 'm', label: 'M to L', style: { arrow: 'reverse' } }, { id: 'nc', source: 'n', target: 'c', label: 'N to C', style: { arrow: 'forward' } },
  { id: 'oa', source: 'c', target: 'o', label: 'Both', style: { arrow: 'both' } }, { id: 'pa', source: 'c', target: 'p', label: 'Both', style: { arrow: 'both' } },
  { id: 'qa', source: 'c', target: 'q', label: 'Both', style: { arrow: 'both' } },
]


/**
 * Initialize Layout and Renderer Options
 */
const layoutOptions: Partial<Force.LayoutOptions> = {
  nodeStrength: -500,
}

const container: HTMLDivElement = document.querySelector('#graph')
const renderOptions: Partial<RendererOptions> = {
  width: container.offsetWidth,
  height: container.offsetHeight,
  zoom: 1,
  onNodePointerDown: (_, { id }, x, y) => {
    nodes = nodes.map((node) => (node.id === id ? { ...node, x, y } : node))
    renderer({ nodes, edges, options: renderOptions })
  },
  onNodeDrag: (_, { id }, x, y) => {
    nodes = nodes.map((node) => (node.id === id ? { ...node, x, y } : node))
    renderer({ nodes, edges, options: renderOptions })
  },
  onNodePointerEnter: (_, { id }) => {
    nodes = nodes.map((node) => (node.id === id ?
      {
        ...node,
        style: {
          ...node.style,
          stroke: node.id === 'a' ?
            node.style.stroke.map((stroke, idx) => ({ ...stroke, color: idx % 2 === 0 ? '#FFF' : '#CCC' })) :
            node.style.stroke.map((stroke) => ({ ...stroke, color: '#CCC' }))
        }
      } :
      node
    ))
    renderer({ nodes, edges, options: renderOptions })
  },
  onNodePointerLeave: (_, { id }) => {
    nodes = nodes.map((node) => (node.id === id ?
      {
        ...node,
        style: {
          ...node.style,
          stroke: node.id === 'a' ?
            createCompanyStyle(48).stroke :
            createPersonStyle(48).stroke
        }
      } :
      node
    ))
    renderer({ nodes, edges, options: renderOptions })
  },
  onEdgePointerEnter: (_, { id }) => {
    edges = edges.map((edge) => (edge.id === id ? { ...edge, style: { ...edge.style, width: 3 } } : edge))
    renderer({ nodes, edges, options: renderOptions })
  },
  onEdgePointerLeave: (_, { id }) => {
    edges = edges.map((edge) => (edge.id === id ? { ...edge, style: { ...edge.style, width: 1 } } : edge))
    renderer({ nodes, edges, options: renderOptions })
  },
  onNodeDoubleClick: (_, { id }) => {
    nodes = nodes.map((node) => (node.id === id ? {
      ...node,
      style: { ...node.style, color: '#EFEFEF', icon: undefined },
      subGraph: {
        nodes: (node.subGraph?.nodes ?? []).concat([
          { id: '', radius: 21, label: `${node.id.toUpperCase()} ${node.subGraph?.nodes.length ?? 0 + 1}`, style: createSubgraphStyle(21) },
          { id: '', radius: 21, label: `${node.id.toUpperCase()} ${node.subGraph?.nodes.length ?? 0 + 2}`, style: createSubgraphStyle(21) },
          { id: '', radius: 21, label: `${node.id.toUpperCase()} ${node.subGraph?.nodes.length ?? 0 + 3}`, style: createSubgraphStyle(21) },
        ])
          .map<Node>((subNode, idx) => ({ ...subNode, id: `${node.id}_${idx}` })),
        edges: []
      },
    } : node))

    subGraph({ nodes, edges }).then((graph) => {
      nodes = graph.nodes
      renderer({ nodes, edges, options: renderOptions })
    })
  },
  onContainerPointerUp: () => {
    nodes = nodes.map((node) => (node.subGraph ? {
      ...node,
      radius: 24,
      style: node.id === 'a' ? createCompanyStyle(48) : createPersonStyle(48),
      subGraph: undefined,
    } : node))

    subGraph({ nodes, edges }).then((graph) => {
      nodes = graph.nodes
      renderer({ nodes, edges, options: renderOptions })
    })
  },
  onWheel: (_, __, scale) => {
    renderOptions.zoom = Zoom.clampZoom(0.2, 2.5, scale)
    // renderer({ nodes, edges, options: renderOptions })
  }
}


/**
 * Initialize Layout and Renderer and Controls
 */
const force = Force.Layout()
const subGraph = SubGraph.Layout()
const zoomControl = Zoom.Control({ container })
const renderer = Renderer({
  container,
  // debug: { stats, logPerformance: true }
})

const zoomOptions: Partial<Zoom.Options> = {
  top: 80,
  onZoomIn: () => {
    renderOptions.zoom = Zoom.clampZoom(0.2, 2.5, renderOptions.zoom / 0.6)
    renderer({ nodes, edges, options: renderOptions })
  },
  onZoomOut: () => {
    renderOptions.zoom = Zoom.clampZoom(0.2, 2.5, renderOptions.zoom * 0.6)
    renderer({ nodes, edges, options: renderOptions })
  },
}


/**
 * Layout and Render Graph
 */
zoomControl(zoomOptions)

force({ nodes, edges, options: layoutOptions }).then((graph) => {
  nodes = graph.nodes
  renderer({ nodes, edges, options: renderOptions })
})

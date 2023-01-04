import shader from "./shader.wgsl"
import { TriangleMesh } from "./mesh"

const init = async () => {
    if (!navigator.gpu) {
        return alert('gpu not supported')
    }

    const canvas : HTMLCanvasElement = <HTMLCanvasElement> document.querySelector('#gfx')
    
    const adapter : GPUAdapter = <GPUAdapter> await navigator.gpu.requestAdapter(
        <GPURequestAdapterOptions> {
        powerPreference: 'high-performance'
        }
    )
    
    let device : GPUDevice | null = <GPUDevice> await adapter?.requestDevice()
    device.lost.then(info => {
        console.error(`WebGPU device was lost: ${info.message}`)
        device = null
    })
    const context : GPUCanvasContext = <GPUCanvasContext><unknown> canvas.getContext('webgpu') // HOW DO YOU GET TYPES???
    const format : GPUTextureFormat = 'bgra8unorm'

    context.configure({
        device, format,
        alphaMode: 'opaque'
    })

    const triangleMesh : TriangleMesh = new TriangleMesh(device)

    const bindGroupLayout = device.createBindGroupLayout({ entries: [] })

    const bindGroup = device.createBindGroup({
            layout: bindGroupLayout,
            entries: []
    })

    const pipeLineLayout = device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] })

    const pipeline : GPURenderPipeline = <GPURenderPipeline> device.createRenderPipeline(
        {
            vertex: {
                module: device.createShaderModule({
                    code: shader
                }),
                entryPoint: 'vs_main',
                buffers: [triangleMesh.bufferLayout,]
            },
            fragment: {
                module: device.createShaderModule({
                    code: shader
                }),
                entryPoint: 'fs_main',
                targets: [{
                    format
                }]
            },
            primitive: {
                topology: 'triangle-list'
            },
            layout: pipeLineLayout
        } as GPURenderPipelineDescriptor
    )

    const commandEncoder : GPUCommandEncoder = device.createCommandEncoder()
    const textureView : GPUTextureView = context.getCurrentTexture().createView()
    const renderPass : GPURenderPassEncoder = commandEncoder.beginRenderPass(
        {
            colorAttachments: [{
                view: textureView,
                clearValue: {r: 0.5, g: 0.0, b: 0.25, a: 1.0},
                loadOp: 'clear',
                storeOp: 'store'
            }]
        }
    )
    renderPass.setPipeline(pipeline)
    renderPass.setVertexBuffer(0, triangleMesh.buffer)
    renderPass.setBindGroup(0, bindGroup)
    renderPass.draw(3, 1, 0, 0)
    renderPass.end()

    device.queue.submit([commandEncoder.finish()])
}

init()


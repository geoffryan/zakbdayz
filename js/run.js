import { initBuffers } from "./init_buffers.js";
import { drawScene } from "./draw_scene.js";

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main()
{
    // gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, 0, 1);;
    vTextureCoord = aTextureCoord;
}
`;


const fsSource = `
varying highp vec2 vTextureCoord;
uniform ivec2 iResolution;
uniform lowp vec3 baseColor;


void main()
{
    gl_FragColor = vec4(baseColor.x + 0.5*vTextureCoord.x,
                        baseColor.y + 0.5*vTextureCoord.y,
                        baseColor.z, 1.0);
}
`;

main();

function initShaderProgram(gl, vsSource, fsSource)
{
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS))
    {
        alert(
            `Unable to initialize the shader program: ${gl.getProgramInfoLog(shaderProgram,)}`,);
        return null;
    }

    return shaderProgram;
}

function loadShader(gl, type, source)
{
    const shader = gl.createShader(type);

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        alert(
            `An error occured compiling shader: ${gl.getShaderInfoLog(shader)}`,);
        gl.deleteShader(shader);
        return null;
    }
    return shader
}

function main()
{
    const canvas = document.querySelector("#glcanvas");
    const gl = canvas.getContext("webgl");

    if(gl === null)
    {
        alert("Unable to initialize WebGL. Browser unsupported.");
        return;
    }

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

    const programInfo = {
        program: shaderProgram,
        attribLocations: {
            vertexPosition: gl.getAttribLocation(shaderProgram,
                                                "aVertexPosition"),
            textureCoord: gl.getAttribLocation(shaderProgram,
                                                "aTextureCoord"),
        },
        uniformLocations: {
            projectionMatrix: gl.getUniformLocation(shaderProgram,
                                                    "uProjectionMatrix"),
            modelViewMatrix: gl.getUniformLocation(shaderProgram,
                                                    "uModelViewMatrix"),
            iResolution: gl.getUniformLocation(shaderProgram,
                                                    "iResolution"),
            baseColor: gl.getUniformLocation(shaderProgram,
                                                    "baseColor"),
        },
    };


    const buffers = initBuffers(gl);

    let then = 0;
    let t_start = -6000.0;

    function render(now)
    {
        now *= 0.001;
        let dt = now - then;
        then = now;

        drawScene(gl, programInfo, buffers, now, dt);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
    
    // drawScene(gl, programInfo, buffers);
}

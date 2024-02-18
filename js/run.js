import { initBuffers } from "./init_buffers.js";
import { drawScene } from "./draw_scene.js";

const vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 UV;

void main()
{
    // gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    gl_Position = vec4(aVertexPosition.x, aVertexPosition.y, 0, 1);;
    UV = aTextureCoord;
}
`;


const fsSource = `
precision highp float;

#define PI 3.14159265359

varying highp vec2 UV;
uniform vec2 resolution;
uniform vec3 baseColor;
uniform float time;

float linesegment_sdf(vec2 p, vec2 a, vec2 b)
{
    vec2 ba = b - a;
    vec2 pa = p - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - h * ba);
}

float z_sdf(vec2 p, vec2 a, vec2 b)
{
    vec2 dx = vec2(b.x - a.x, 0.0);

    float s = linesegment_sdf(p, a, a + dx);
    s = min(s, linesegment_sdf(p, b, b - dx));
    s = min(s, linesegment_sdf(p, a, b));

    return s;
}

mat2 rotate2D(float phi)
{
    return mat2(cos(phi), sin(phi), -sin(phi), cos(phi));
}

void main()
{
    vec3 pos = vec3((UV.x-0.5) * resolution.x
                             / resolution.y, 
                          UV.y - 0.5, 0.0);


    mat2 m = rotate2D(time);
    vec2 za = vec2(-0.2, -0.3);
    vec2 zb = vec2(0.2, 0.3);
    float thickness = 0.1;
    float phi = atan(pos.y, pos.x);

    float s = z_sdf(pos.xy, za, zb) - thickness;

    float noise1 = s * 0.4 * (sin(20.0*PI*phi) + cos(14.0*PI*phi));
    float noise2 = s * 0.6 * (sin(16.0*PI*phi) + cos(4.0*PI*phi));
    
    float phase1 = 2.0*time + noise1;
    float phase2 = 2.2*time + noise2;


    float v1 = clamp(cos(100.0*s - phase1), 0.0, 1.0) * exp(-4.0*abs(s));
    float v2 = clamp(cos(100.0*s - phase2), 0.0, 1.0) * exp(-4.0*abs(s));

    gl_FragColor = vec4(v1,
                        v2,
                        v2, 1.0);

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
            resolution: gl.getUniformLocation(shaderProgram,
                                                    "resolution"),
            baseColor: gl.getUniformLocation(shaderProgram,
                                                    "baseColor"),
            time: gl.getUniformLocation(shaderProgram,
                                                    "time"),
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

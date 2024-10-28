let viewerRef
let isSceneReady = false
let initTimeout
let beforeInitCMD = []

export const newNavStoreRef = (ref, sceneIsReady) => {
    if(ref.iafviewerRef && sceneIsReady) {
        isSceneReady = true;
        viewerRef = ref.iafviewerRef.current;
    }
}

export const storeRef = (ref, sceneIsReady) => {
    //we need to give option to allow parent component to control isSceneReady to skip executing some functions as async
    //when parent component functionality strictly depends on the returned ids of the actions
    //TODO: move tracking of ids and cleanup functions to this service if we want to queue actions
    if(ref.iafviewerRef && sceneIsReady) {
        isSceneReady = true;
        viewerRef = ref.iafviewerRef.current;
    }
    if (ref.iafviewerRef && (!initTimeout)) {
        initTimeout = setInterval(() => {
            if (/*ref?.iafviewerRef?.current?.isSceneReady &&*/ ref?.iafviewerRef?.current?.state.isModelStructureReady) {
                clearInterval(initTimeout)
                viewerRef = ref.iafviewerRef.current
                isSceneReady = true
                overrideViewerFunctions(viewerRef)
                callBeforeInitCMD()
                displayShaded()
            }
        }, 1000);
    }
}

export const getStoredRef = (ref) => {
    return viewerRef;
}

export const callBeforeInitCMD = () => {
    for (const cmd of beforeInitCMD) {
        cmd.call()
    }
}

export const overrideViewerFunctions = (ref) => {
    // isolateSlicedElementIds
    const overrideIsolateSlicedElementIds = ref.isolateSlicedElementIds    
    const isolateSlicedElementIdsWrapper = async (viewer, idmapping, prevProps) => {
        await overrideIsolateSlicedElementIds(viewer, idmapping, prevProps)
        displayShaded()
    }

    ref.isolateSlicedElementIds = isolateSlicedElementIdsWrapper
}


export const getPkgIdFromNodeId = (nodeId) => {
    let pkgId
    let currentNodeId = nodeId

    let i = 0
    while (!pkgId && i < 20) {
        i++
        let pkgFromNode = viewerRef.props.idMapping[0][currentNodeId]
        if (pkgFromNode) {
            return pkgFromNode
        }
        currentNodeId = viewerRef._viewer.model.getNodeParent(currentNodeId)
    }

    return
}

export const getNodeIdFromPkgId = (pkgId) => {
    return parseInt(viewerRef.props.idMapping[1][pkgId])
}

export const displayCircleWithText = async (args) => {
    const {
        pkgId,
        circleCoordinates,
        circleRadius,
        circleColor,
        text,
        textColor,
        textSize,
        textUnder,
        textUnderColor,
        textUnderSize, 
        coordinates
    } = args
    if (!isSceneReady) {
        beforeInitCMD.push(() => displayCircleWithText(args))
        return
    }
    let nodeBoundingNode
    if(pkgId){
        let nodeId = getNodeIdFromPkgId(pkgId)
        nodeBoundingNode = await viewerRef._viewer.model.getNodeRealBounding(nodeId)
        nodeBoundingNode = nodeBoundingNode.center()    
    }
    nodeBoundingNode = {...nodeBoundingNode, ...(coordinates || {})}
    
    let markupIds = []

    const circleGraphic = new CircleMarkup(
        viewerRef._viewer,
        new window.Communicator.Point3(nodeBoundingNode.x, nodeBoundingNode.y, nodeBoundingNode.z + 2000),
        circleRadius,
        new window.Communicator.Color(circleColor[0], circleColor[1], circleColor[2])
    )
    let circleId = viewerRef._viewer.markupManager.registerMarkup(circleGraphic);
    markupIds.push(circleId)

    if (text) {
        const textGraphic = new TextMarkup(
            viewerRef._viewer,
            new window.Communicator.Point3(nodeBoundingNode.x, nodeBoundingNode.y, nodeBoundingNode.z + 2001),
            circleRadius,
            text,
            new window.Communicator.Color(textColor[0], textColor[1], textColor[2]),
            textSize
        )
        let textId = viewerRef._viewer.markupManager.registerMarkup(textGraphic);
        markupIds.push(textId)
    }

    if (textUnder) {
        const textUnderGraphic = new TextMarkup(
            viewerRef._viewer,
            new window.Communicator.Point3(nodeBoundingNode.x - 1000, nodeBoundingNode.y - 2500, nodeBoundingNode.z + 2001),
            circleRadius,
            textUnder,
            new window.Communicator.Color(textUnderColor),
            textUnderSize
        )
        let textUnderId = viewerRef._viewer.markupManager.registerMarkup(textUnderGraphic);
        markupIds.push(textUnderId)
    }

    return markupIds
}


export const removeGraphics = async (graphicIds) => {
    for (const graphicId of graphicIds) {
        await viewerRef._viewer.markupManager.unregisterMarkup(graphicId);
    }
}

export const removeAllGraphics = async () => {
    if (!isSceneReady) {
        return;
    }
    for (const markupItem of viewerRef._viewer.markupManager._itemManager._markupItems) {
        await viewerRef._viewer.markupManager.unregisterMarkup(markupItem[0]);
    }
}

export const addCameraCallback = () => {
    viewerRef?._viewer.setCallbacks({
        camera: (event) => {
            //console.log("Camera ~ event", event)
        },
        selectionArray: (events) => {
            const event = events.pop();
            const selection = viewerRef?.props?.selection;
            const spaceElementIds = viewerRef?.props?.spaceElementIds || [];
            if(selection?.length === 1 && !spaceElementIds.includes(selection[0]) /*do not do the zoom for spaces*/ && +getNodeIdFromPkgId(selection[0]) === event?._selection?._nodeId) {
                //attempt to do a graceful zoom out, so it does not "flicker"
                for(let t = 500, l = 0; l<10; l++,t=t+20){
                    setTimeout(() => doZoom(0.15,true), t);
                }
            }
        }
    })
}

export const setCameraOnTop = () => {
    viewerRef?._viewer?.view?.setCamera(window.Communicator.Camera.fromJson({
        height: 20900.354225865514,
        nearLimit: 0.001,
        position: {x: -21015.557235545588, y: 4044, z: 8000},
        projection: 0,
        target: {x: -21015.29903515957, y: 5859.492871741294, z: -2365.836921556089},
        up: {x: 0.0031816413870965187, y: 0.6999891652145367, z: 0.004112164198134297},
        width: 30617.354225865514
    }))
}

export const disableNavCube = () => {
    if(isSceneReady) {
        viewerRef?._viewer?.view.getNavCube().disable();
    } else {
        beforeInitCMD.push(() => viewerRef?._viewer?.view.getNavCube().disable())
    }
}

export const displayShaded = () => {
    if(isSceneReady) {
        viewerRef?._viewer?.view.setDrawMode(Communicator.DrawMode.Shaded);
    } else {
        beforeInitCMD.push(() => viewerRef?._viewer?.view.setDrawMode(Communicator.DrawMode.Shaded))
    }
}

export const displayNoLines = () => {
    if(isSceneReady) {
        viewerRef?._viewer?.view.setDrawMode(Communicator.DrawMode.HiddenLine);
    } else {
        beforeInitCMD.push(() => viewerRef?._viewer?.view.setDrawMode(Communicator.DrawMode.HiddenLine))
    }
}

export const resetAll = () => {
    if(isSceneReady) {
        let commands = viewerRef.commands;
        if (commands && commands.resetAll) {
            commands.resetAll();
        }
    }
}

export const getCameraPosition = () => {
    return viewerRef?._viewer?.view.getCamera().toJson()
}

export const setCameraPosition = (camera) => {
    viewerRef?._viewer?.view.setCamera(window.Communicator.Camera.fromJson(camera))
}

export const setBackgroundColor = (colorTop, colorBottom) => {
    viewerRef?._viewer?.view?.setBackgroundColor(
        new window.Communicator.Color(colorTop[0], colorTop[1], colorTop[2]),
        new window.Communicator.Color(colorBottom[0], colorBottom[1], colorBottom[2])
    )
}

export const setClientTimeout = () => {
    viewerRef?._viewer?.resetClientTimeout()
    viewerRef?._viewer?.setClientTimeout(60*24 /*timeout minutes*/, 60*24/*timeout warning*/)
}


export const doZoom = (delta,preserveViewAngle) =>
{
    console.log("viewerRef", viewerRef)
    const viewer = viewerRef?._viewer;
    let camera = viewer.view.getCamera();
    const view = viewer.view;
    const zoom = 1.0 / (1.0 - delta);

    camera.setWidth(camera.getWidth() * zoom);
    camera.setHeight(camera.getHeight() * zoom);

    if (preserveViewAngle) {
        const position = camera.getPosition();
        const target = camera.getTarget();

        const newDelta = window.Communicator.Point3.subtract(target, position).scale(zoom);
        camera.setPosition(window.Communicator.Point3.subtract(target, newDelta));
    }

    view.setCamera(camera);
}

class CircleMarkup extends window.Communicator.Markup.MarkupItem {
    _viewer
    _position
    _circle = new window.Communicator.Markup.Shape.Circle();
    _circleElement

    constructor(viewer, position, radius, color, opacity = 1) {
        super();
        this._viewer = viewer;
        this._position = position;

        this._circle.setRadius(radius);
        this._circle.setFillColor(color);
        this._circle.setStrokeColor(color)
        this._circle.setFillOpacity(opacity)
    }

    draw() {
        if (this._circle) {
            const center = this._viewer.view.projectPoint(this._position);
            this._circle.setCenter(window.Communicator.Point2.fromPoint3(center));
            this._circleElement = this._viewer.markupManager.getRenderer().drawCircle(this._circle);
        }
    }
}

class TextMarkup extends window.Communicator.Markup.MarkupItem {
    _viewer
    _position
    _radius
    _text = new window.Communicator.Markup.Shape.Text();
    _textElement
    _textValue;

    constructor(viewer, position, radius, text, textColor, textSize = 16) {
        super();
        this._viewer = viewer;
        this._position = position;
        this._radius = radius;
        this._textSize = textSize;
        this._textValue = text

        this._text.setText(text);
        this._text.setFontSize(textSize);
        this._text.setFillOpacity(1);
        this._text.setFillColor(textColor)
        this._text.setStrokeColor(textColor)
        this._text.setStrokeWidth(1.4)
    }

    draw() {
        if (this._text) {
            const center = this._viewer.view.projectPoint(this._position);
            const textSize = this._viewer.markupManager.getRenderer().measureText(this._text._text, this._text)
            center.x -= (textSize.x / 2)
            center.y -= (this._radius - (textSize.y * 0.25))
            this._text.setPosition(window.Communicator.Point2.fromPoint3(center));
            this._textElement = this._viewer.markupManager.getRenderer().drawText(this._text);
        }
    }
}
import * as THREE from "three"
import { OrbitControls } from "OrbitControls"
import { BoxLineGeometry } from "BoxLineGeometry"
import { XRButton } from "XRButton"
import { XRControllerModelFactory } from "XRControllerModelFactory"
import gsap from "gsap"

// Setup
const clock = new THREE.Clock()

let container
let camera, scene, raycaster, renderer
let controller1, controller2
let controllerGrip1, controllerGrip2
let elapsedTime
let clickTime
let doubleClick = false
let scaleBool = false

let room
let cube, cube2
let controls

let molecule1
let molecule2
let moleculeGroup

let hydrogen1a
let hydrogen1b
let oxygen1
let hydrogen2a
let hydrogen2b
let oxygen2

let bond

let selected = false
let intersected = []
let worldGroup

let myObj = {
	scale: 1,
	selected: false
}

init()
animate()

// Init
function init() {

	// Canvas
	container = document.createElement('div')
	document.body.appendChild(container)

	// Scene
	scene = new THREE.Scene()
	scene.background = new THREE.Color(0x505050)

	// Camera
	camera = new THREE.PerspectiveCamera(
		50,
		window.innerWidth / window.innerHeight,
		0.1,
		10)
	camera.position.set(0, 1.6, -1)
	scene.add(camera)

	// Controls
	controls = new OrbitControls(camera, container)
	controls.target.set(0, 1.6, 0)
	controls.update()

	// Room
	room = new THREE.LineSegments(
		new BoxLineGeometry(6, 6, 6, 30, 30, 30).translate(0, 2, 0),
		new THREE.LineBasicMaterial({ color: 0xbcbcbc } )
	)
	scene.add(room)

	// Light
	const light = new THREE.DirectionalLight(0xffffff, 3)
	light.position.set(0, 5, 0)
	light.lookAt(0, 0, 0)
	light.castShadow = true
	light.shadow.mapSize.set(4096, 4096)
	scene.add(light)

	// World Group
	worldGroup = new THREE.Group()
	scene.add(worldGroup)

	// Test Cube
	/*
	const cubeGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.25)
	const cubeMaterial = new THREE.MeshNormalMaterial()
	cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
	cube2 = new THREE.Mesh(cubeGeometry, cubeMaterial)
	cube.position.set(0, 1.5, -1)
	cube2.position.set(-0.5, 1, -0.5)
	cube.castShadow = true
	cube2.castShadow = true
	cube2.receiveShadow = true
	worldGroup.add(cube)
	worldGroup.add(cube2)
	*/

	// Molecule Groups
	moleculeGroup = new THREE.Group()
	worldGroup.add(moleculeGroup)

	molecule1 = new THREE.Group()
	molecule2 = new THREE.Group()
	moleculeGroup.add(molecule1)
	moleculeGroup.add(molecule2)

	// Molecule 1
	const hGeometry = new THREE.SphereGeometry(0.1)
	const hMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color('white')
	})

	const oGeometry = new THREE.SphereGeometry(0.125)
	const oMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color('red')
	})

	hydrogen1a = new THREE.Mesh(hGeometry, hMaterial)
	hydrogen1a.position.set(-0.066, 0.0, 0)
	hydrogen1a.castShadow = true
	hydrogen1a.receiveShadow = true

	hydrogen1b = new THREE.Mesh(hGeometry, hMaterial)
	hydrogen1b.position.set(0.066, 0.0, 0)
	hydrogen1b.castShadow = true
	hydrogen1b.receiveShadow = true

	oxygen1 = new THREE.Mesh(oGeometry, oMaterial)
	oxygen1.position.set(0, 0.075, 0)
	oxygen1.castShadow = true
	oxygen1.receiveShadow = true

	molecule1.add(hydrogen1a)
	molecule1.add(hydrogen1b)
	molecule1.add(oxygen1)

	const bGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.35)
	const bMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color('aqua')
	})
	bond = new THREE.Mesh(bGeometry, bMaterial)
	bond.position.set(0, 0.075, 0.3)
	bond.rotation.x = Math.PI * 0.5

	molecule1.add(bond)
	bond.castShadow = true
	bond.receiveShadow = true

	// Molecule 2
	hydrogen2a = new THREE.Mesh(hGeometry, hMaterial)
	hydrogen2a.position.set(-0.066, 0.0, 0.0)
	hydrogen2a.castShadow = true
	hydrogen2a.receiveShadow = true

	hydrogen2b = new THREE.Mesh(hGeometry, hMaterial)
	hydrogen2b.position.set(0.066, 0.0, 0.0)
	hydrogen2b.castShadow = true
	hydrogen2b.receiveShadow = true

	oxygen2 = new THREE.Mesh(oGeometry, oMaterial)
	oxygen2.position.set(0, 0.075, 0.0)
	oxygen2.castShadow = true
	oxygen2.receiveShadow = true

	molecule2.add(hydrogen2a)
	molecule2.add(hydrogen2b)
	molecule2.add(oxygen2)

	// Position molecules
	molecule1.rotation.y = Math.PI * 0.5
	molecule1.position.set(-0.2, 1.5, -1)

	molecule2.rotation.y = Math.PI * 0.5
	molecule2.rotation.x = Math.PI * 0.5
	molecule2.position.set(0.2, 1.5, -1)

	// Center children in group
	const box = new THREE.Box3().setFromObject(moleculeGroup)
	const center = new THREE.Vector3()
	box.getCenter(center)

	moleculeGroup.children.forEach(child => {
		child.position.sub(center)
	})

	moleculeGroup.position.add(center)

	// Floor
	const floorGeometry = new THREE.PlaneGeometry(6, 6)
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: new THREE.Color('grey'),
		side: THREE.DoubleSide
	})
	const floor = new THREE.Mesh(floorGeometry, floorMaterial)
	floor.rotation.x = Math.PI * 0.5
	floor.position.set(0, 0.1, 0)
	floor.receiveShadow = true
	scene.add(floor)

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	renderer.shadowMap.enabled = true
	renderer.xr.enabled = true
	container.appendChild(renderer.domElement)

	window.addEventListener('resize', onWindowResize)
	//window.addEventListener('click', onWindowClick)

	raycaster = new THREE.Raycaster()

	document.body.appendChild(XRButton.createButton( renderer, { 'optionalFeatures': [ 'depth-sensing'] } ) )

	// Controllers
	controller1 = renderer.xr.getController(0)
	controller1.addEventListener('selectstart', onSelectStart)
	controller1.addEventListener('selectend', onSelectEnd)
	scene.add(controller1)

	controller2 = renderer.xr.getController(1)
	controller2.addEventListener('selectstart', onSelectStart)
	controller2.addEventListener('selectend', onSelectEnd)
	scene.add(controller2)

	const controllerModelFactory = new XRControllerModelFactory()

	controllerGrip1 = renderer.xr.getControllerGrip(0)
	controllerGrip1.add(controllerModelFactory.createControllerModel(controllerGrip1))
	scene.add(controllerGrip1)

	controllerGrip2 = renderer.xr.getControllerGrip(1)
	controllerGrip2.add(controllerModelFactory.createControllerModel(controllerGrip2))
	scene.add(controllerGrip2)
}

// Click - Not using
/*
function onWindowClick() {
	if(myObj.test <= 3) {
		gsap.to(myObj, { test: 2, duration: 3, ease: 'elastic' })
	}
	if(myObj.test >= 3) {
		gsap.to(myObj, { test: 1, duration: 3, ease: 'elastic' })
	}
}
*/

// Resize
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	renderer.setSize(window.innerWidth, window.innerHeight)
}

// Animate
function animate() {
	renderer.setAnimationLoop(render)
}

// selectStart
function onSelectStart(event)
{
	// Double Click
	let clickDelta = elapsedTime - clickTime
	doubleClick = false
	if(clickDelta < 0.5){ doubleClick = true }
	clickTime = elapsedTime

	// Unused
	//selected = true
	//console.log(event.target)
	
	const controller = event.target

	const intersections = getIntersections(controller)

	if(intersections.length > 0){
		const intersection = intersections[0]

		const object = intersection.object
		//controller.attach(object)
		controller.attach(moleculeGroup)

		controller.userData.selected = object

		if(doubleClick){ scaleBool = !scaleBool }
	}

	controller.userData.targetRayMode = event.data.targetRayMode
}

// selectEnd
function onSelectEnd(event)
{
	// Unused
	//selected = false
	//console.log(event.target)
	const controller = event.target

	if(controller.userData.selected != undefined){
		const object = controller.userData.selected
		//worldGroup.attach(object)
		worldGroup.attach(moleculeGroup)

		controller.userData.select = undefined
	}
}

function getIntersections(controller)
{
	controller.updateMatrixWorld()

	raycaster.setFromXRController(controller)

	return raycaster.intersectObjects(worldGroup.children, true)
}

// Render
function render() {
	// time
	const delta = clock.getDelta() * 60
	elapsedTime = clock.getElapsedTime()

	// gsap ticker
	gsap.ticker.tick(delta)

	// render
	renderer.render(scene, camera)

	// Placing double click here
	if(doubleClick)
	{
		doubleClick = false

		if(scaleBool)
		{
			gsap.to(myObj, { scale: 10, duration: 1, ease: 'bounce' })
		} else {
			gsap.to(myObj, { scale: 1, duration: 1, ease: 'bounce' })
		}
	}

	// Scale Molecule Group
	moleculeGroup.scale.x = myObj.scale
	moleculeGroup.scale.y = myObj.scale
	moleculeGroup.scale.z = myObj.scale
}

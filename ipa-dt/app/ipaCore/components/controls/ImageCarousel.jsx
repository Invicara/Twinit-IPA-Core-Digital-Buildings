import React, {useEffect, useState} from "react"
import { ScriptCache } from "@invicara/ipa-core/modules/IpaUtils";


const ImageCarousel = () => {
    const [images, setImages] = useState([])
    const [imagePointer, setImagePointer] = useState(0)

    useEffect(getImageLinks, [])

    /**
    * function to fetch the images
    */
    async function getImageLinks() {
        const images = await ScriptCache.runScript("getImageLinks", {})
        setImages([...images, images[0], images[1], images[2]])
    }

    return <div className="carousel carousel-images">
        {images.slice(imagePointer, imagePointer + 4).map((image, index) => {
            return (
                <div key={index} className={`carousel-slide`}>
                    <img
                        className="img"
                        src={image.img}
                        alt={image.alt}
                        onAnimationIteration={() => {
                            if (index === 0) {
                                if (imagePointer < 4) {
                                    setImagePointer(imagePointer + 1)
                                } else {
                                    setImagePointer(0)
                                }
                            }
                        }}
                    />
                </div>
            )
        })}
    </div>
}

export default ImageCarousel;

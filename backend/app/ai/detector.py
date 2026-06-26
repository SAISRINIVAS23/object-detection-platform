import cv2
import numpy as np
import base64
from app.ai.yolo_model import model

def detect_image(image_path, output_path, conf=0.25):
    results = model(image_path, conf=conf)
    annotated = results[0].plot()
    cv2.imwrite(output_path, annotated)

    detections = []
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])
        detections.append({
            "object": class_name,
            "confidence": round(confidence, 2)
        })
    return detections

def detect_frame(image_bytes, conf=0.25):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid frame image")

    results = model(img, conf=conf)
    annotated = results[0].plot()

    _, buffer = cv2.imencode(".jpg", annotated)
    annotated_base64 = base64.b64encode(buffer).decode("utf-8")

    detections = []
    for box in results[0].boxes:
        class_id = int(box.cls[0])
        class_name = model.names[class_id]
        confidence = float(box.conf[0])
        detections.append({
            "object": class_name,
            "confidence": round(confidence, 2)
        })
    return detections, annotated_base64

def detect_video(video_path, output_path, conf=0.25):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    # Define standard mp4 codec writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    detections_list = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        results = model(frame, conf=conf)
        annotated_frame = results[0].plot()
        out.write(annotated_frame)

        # Collect detections
        for box in results[0].boxes:
            class_id = int(box.cls[0])
            class_name = model.names[class_id]
            confidence = float(box.conf[0])
            detections_list.append({
                "object": class_name,
                "confidence": round(confidence, 2)
            })

    cap.release()
    out.release()

    # Aggregate detections
    summary = {}
    for item in detections_list:
        obj = item["object"]
        conf_val = item["confidence"]
        if obj not in summary:
            summary[obj] = []
        summary[obj].append(conf_val)

    aggregated = []
    for obj, confs in summary.items():
        aggregated.append({
            "object": obj,
            "confidence": round(sum(confs) / len(confs), 2)
        })

    return aggregated
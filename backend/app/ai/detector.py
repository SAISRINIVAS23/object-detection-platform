import cv2
import numpy as np
import base64
from app.ai.yolo_model import get_yolo_model

def detect_image(image_path, output_path, conf=0.25):
    model = get_yolo_model()
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
    model = get_yolo_model()
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Invalid frame image")

    results = model(img, conf=conf, imgsz=320)
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
    model = get_yolo_model()
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file")

    original_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    original_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 25

    # Downscale video frames to max 640px to optimize YOLO inference speed and upload file size
    max_dim = 640
    if max(original_width, original_height) > max_dim:
        scale = max_dim / max(original_width, original_height)
        width = int(original_width * scale)
        height = int(original_height * scale)
    else:
        width = original_width
        height = original_height

    # Attempt to open VideoWriter using web-friendly H.264 (avc1) codec, with fallback to mp4v
    fourcc = cv2.VideoWriter_fourcc(*'avc1')
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    if not out.isOpened():
        print("avc1 codec not supported/opened, falling back to mp4v codec")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

    detections_list = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        # Resize the frame if it was downscaled
        if original_width != width or original_height != height:
            frame_resized = cv2.resize(frame, (width, height))
        else:
            frame_resized = frame

        results = model(frame_resized, conf=conf, imgsz=320)
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
import torch
import os

model_instance = None

def get_yolo_model():
    global model_instance
    if model_instance is None:
        print("Lazy loading YOLO11 model...")
        # Set thread limits inside the lazy loader to ensure it runs single-threaded
        torch.set_num_threads(1)
        from ultralytics import YOLO
        model_instance = YOLO("yolo11n.pt")
        print("YOLO11 model loaded successfully!")
    return model_instance
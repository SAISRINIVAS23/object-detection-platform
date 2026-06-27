import torch
torch.set_num_threads(1)
from ultralytics import YOLO

print("Loading YOLO11 model...")

# Automatically downloads the model on first run
model = YOLO("yolo11n.pt")

print("YOLO11 model loaded successfully!")
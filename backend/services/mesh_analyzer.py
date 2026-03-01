
import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


def analyze_mesh(file_path: str, file_format: str) -> Dict[str, Any]:
    fmt = file_format.lower().strip(".")

    try:
        import trimesh

        if fmt == "stl":
            mesh = trimesh.load(file_path, file_type="stl", force="mesh")
        elif fmt == "obj":
            mesh = trimesh.load(file_path, file_type="obj", force="mesh")
        elif fmt == "3mf":
            mesh = trimesh.load(file_path, file_type="3mf", force="mesh")
        else:
            raise ValueError(f"Unsupported format: {fmt}")


        if hasattr(mesh, "dump"):

            mesh = trimesh.util.concatenate(mesh.dump())

        if mesh is None or len(mesh.vertices) == 0:
            raise ValueError("Empty or invalid mesh")

        bounds = mesh.bounds
        extents = mesh.extents

        dim_x = float(extents[0])
        dim_y = float(extents[1])
        dim_z = float(extents[2])


        volume_mm3 = abs(float(mesh.volume)) if mesh.is_watertight else _estimate_volume(mesh)
        volume_cm3 = volume_mm3 / 1000.0


        surface_area_mm2 = float(mesh.area)
        surface_area_cm2 = surface_area_mm2 / 100.0

        polygon_count = len(mesh.faces)

        return {
            "dim_x": round(dim_x, 3),
            "dim_y": round(dim_y, 3),
            "dim_z": round(dim_z, 3),
            "volume_cm3": round(volume_cm3, 4),
            "surface_area_cm2": round(surface_area_cm2, 4),
            "polygon_count": polygon_count,
        }

    except ImportError:
        logger.error("trimesh not installed")
        raise
    except Exception as e:
        logger.error(f"Mesh analysis failed for {file_path}: {e}")
        raise ValueError(f"Could not analyze mesh: {str(e)}")


def _estimate_volume(mesh) -> float:

    extents = mesh.extents

    try:
        return float(mesh.convex_hull.volume)
    except Exception:
        return float(extents[0] * extents[1] * extents[2]) * 0.5

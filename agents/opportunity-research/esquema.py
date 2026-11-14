"""Esquema del dossier que produce el agente."""
from typing import Literal

from pydantic import BaseModel, Field

TipoFuente = Literal["oficial NASA/JPL", "científica", "prensa", "comunitaria"]


class Dato(BaseModel):
    afirmacion: str = Field(description="Un hecho concreto y verificable, en español.")
    fuente_url: str = Field(description="URL de la página donde se leyó el hecho.")
    cita: str = Field(description="Frase LITERAL copiada de esa página que respalda el hecho.")
    confianza: Literal["alta", "media", "baja"] = "media"
    verificado_en_texto: bool | None = Field(default=None, description="Lo rellena el programa, no el modelo.")


class Imagen(BaseModel):
    url: str = Field(description="URL directa del archivo de imagen (jpg/png/tif) devuelta por una herramienta NASA.")
    titulo: str
    descripcion: str
    credito: str = Field(description="Crédito tal como aparece en la fuente, p. ej. 'NASA/JPL-Caltech'.")
    nasa_id: str | None = None
    pagina_url: str | None = Field(default=None, description="Página de la que viene la imagen.")
    licencia_nota: str = Field(default="Verificar el pie de foto: salvo indicación contraria, las imágenes de NASA/JPL son de uso libre con crédito.")
    archivo_local: str | None = Field(default=None, description="Lo rellena el programa al descargar.")


class FuenteNueva(BaseModel):
    titulo: str
    url: str
    editor: str | None = None
    tipo: TipoFuente


class Dossier(BaseModel):
    evento_id: str
    titulo: str
    contexto_ampliado: str = Field(description="Relato en español para estudiantes de 5.º de secundaria, 4 a 8 párrafos, solo con datos respaldados.")
    datos_reales: list[Dato]
    imagenes: list[Imagen]
    fuentes_nuevas: list[FuenteNueva]
    contradicciones: list[str] = Field(description="Valores en conflicto entre fuentes, con las URLs.")
    huecos: list[str] = Field(description="Lo que no se pudo confirmar.")
    ideas_visuales: list[str] = Field(description="Escenas que se pueden ilustrar o animar, basadas en las imágenes y datos hallados.")
    datos_no_verificados: list[Dato] = Field(default_factory=list, description="Lo rellena el programa.")

from datetime import datetime
from typing import Optional

from fastapi import FastAPI
from fastapi.responses import Response
from pydantic import BaseModel
from weasyprint import CSS, HTML

app = FastAPI(title="Ain-Bondhu PDF")


class LetterPDFRequest(BaseModel):
    letter: str
    footer: Optional[str] = None


@app.post("/render")
async def render(req: LetterPDFRequest):
    date_str = datetime.now().strftime("%d-%m-%Y")
    footer = req.footer or "এই নথিটি সাধারণ তথ্যভিত্তিক সহায়তা।"

    html = f"""
    <html lang="bn">
      <head>
        <meta charset="utf-8" />
        <style>
          @font-face {{
            font-family: 'NotoSerifBengali';
            src: url('https://fonts.gstatic.com/ea/notosansbengali/v6/NotoSansBengali-Regular.ttf');
          }}
          body {{
            font-family: 'NotoSerifBengali', serif;
            font-size: 12pt;
            line-height: 1.6;
            color: #1f1b16;
          }}
          .date {{
            text-align: right;
            margin-bottom: 16px;
          }}
          .footer {{
            margin-top: 32px;
            font-size: 10pt;
            color: #6d5b4a;
          }}
        </style>
      </head>
      <body>
        <div class="date">তারিখ: {date_str}</div>
        <div>{req.letter.replace('\n', '<br />')}</div>
        <div class="footer">{footer}</div>
      </body>
    </html>
    """

    pdf = HTML(string=html).write_pdf(
        stylesheets=[CSS(string="@page { size: A4; margin: 24mm; }")]
    )
    return Response(pdf, media_type="application/pdf")

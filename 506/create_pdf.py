from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Create PDF
pdf_file = "DWT_2012_Complete_Solution.pdf"
doc = SimpleDocTemplate(pdf_file, pagesize=letter,
                        rightMargin=72, leftMargin=72,
                        topMargin=72, bottomMargin=18)

# Container for the 'Flowable' objects
elements = []

# Define styles
styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name='Center', alignment=TA_CENTER, fontSize=14, spaceAfter=12))
styles.add(ParagraphStyle(name='Equation', alignment=TA_CENTER, fontSize=12, fontName='Times-Italic', spaceAfter=10))
styles.add(ParagraphStyle(name='Heading1Custom', fontSize=16, spaceAfter=12, spaceBefore=12, textColor='#000080', fontName='Times-Bold'))
styles.add(ParagraphStyle(name='Heading2Custom', fontSize=14, spaceAfter=10, spaceBefore=10, fontName='Times-Bold'))
styles.add(ParagraphStyle(name='BodyText', fontSize=11, spaceAfter=8, fontName='Times-Roman'))

# Title
title = Paragraph("<b>DWT 2012 Problem</b><br/>Complete Step-by-Step Solution", styles['Title'])
elements.append(title)
elements.append(Spacer(1, 0.2*inch))

subtitle = Paragraph("<i>Natural Convection from Vertical Plate with Heat Source</i>", styles['Center'])
elements.append(subtitle)
elements.append(Spacer(1, 0.3*inch))

# Problem Statement
elements.append(Paragraph("<b>Problem Statement</b>", styles['Heading1Custom']))
elements.append(Paragraph("Natural convection flow from an isothermal vertical plate with uniform heat source embedded in a stratified medium.", styles['BodyText']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Given:</b>", styles['Heading2Custom']))
elements.append(Paragraph("• Wall temperature: T<sub>w</sub> = constant", styles['BodyText']))
elements.append(Paragraph("• Ambient temperature: T<sub>∞</sub>(x) = T<sub>0</sub> + B(x/L) (stratified)", styles['BodyText']))
elements.append(Paragraph("• Internal heat generation: Q(T − T<sub>∞</sub>)", styles['BodyText']))
elements.append(Paragraph("• Gravity: g (downward)", styles['BodyText']))

elements.append(PageBreak())

# STEP 1
elements.append(Paragraph("<b>STEP 1: Dimensional Governing Equations</b>", styles['Heading1Custom']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Continuity:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>∂ū/∂x̄ + ∂v̄/∂ȳ = 0</i>", styles['Equation']))

elements.append(Paragraph("<b>Momentum (boundary layer approximation):</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>ū(∂ū/∂x̄) + v̄(∂ū/∂ȳ) = ν(∂²ū/∂ȳ²) + gβ(T − T<sub>∞,x</sub>)</i>", styles['Equation']))

elements.append(Paragraph("<b>Energy:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>ū(∂T/∂x̄) + v̄(∂T/∂ȳ) = α(∂²T/∂ȳ²) + Q(T − T<sub>∞,x</sub>)</i>", styles['Equation']))

elements.append(Spacer(1, 0.1*inch))
elements.append(Paragraph("<b>Boundary Conditions:</b>", styles['Heading2Custom']))
elements.append(Paragraph("At ȳ = 0: ū = v̄ = 0, T = T<sub>w</sub>", styles['BodyText']))
elements.append(Paragraph("As ȳ → ∞: ū → 0, T → T<sub>∞,x</sub>", styles['BodyText']))

elements.append(PageBreak())

# STEP 2
elements.append(Paragraph("<b>STEP 2: Define Reference Scales</b>", styles['Heading1Custom']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("• Length scale: L (reference length)", styles['BodyText']))
elements.append(Paragraph("• Temperature scale: ΔT = T<sub>w</sub> − T<sub>0</sub>", styles['BodyText']))
elements.append(Paragraph("• Velocity scale: U = (ν/L)·Gr<sup>1/2</sup>", styles['BodyText']))

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Grashof Number:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>Gr = gβ(T<sub>w</sub> − T<sub>0</sub>)L³ / ν²</i>", styles['Equation']))

elements.append(PageBreak())

# STEP 3
elements.append(Paragraph("<b>STEP 3: Define Dimensionless Variables</b>", styles['Heading1Custom']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Coordinates:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>x = x̄/L,    y = (Gr<sup>1/4</sup>/L)·ȳ</i>", styles['Equation']))

elements.append(Paragraph("<b>Velocities:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>u = (L/ν)·Gr<sup>−1/2</sup>·ū,    v = (L/ν)·Gr<sup>−1/4</sup>·v̄</i>", styles['Equation']))

elements.append(Paragraph("<b>Temperature:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>θ = (T − T<sub>∞,x</sub>)/(T<sub>w</sub> − T<sub>0</sub>)</i>", styles['Equation']))

elements.append(PageBreak())

# STEP 4
elements.append(Paragraph("<b>STEP 4: Dimensionless Equations</b>", styles['Heading1Custom']))
elements.append(Paragraph("After substitution and simplification:", styles['BodyText']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Continuity:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>∂u/∂x + ∂v/∂y = 0</b></i>", styles['Equation']))

elements.append(Paragraph("<b>Momentum:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>u(∂u/∂x) + v(∂u/∂y) = ∂²u/∂y² + θ</b></i>", styles['Equation']))

elements.append(Paragraph("<b>Energy:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>u(∂θ/∂x) + v(∂θ/∂y) = (1/Pr)(∂²θ/∂y²) + λθ</b></i>", styles['Equation']))

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Parameters:</b>", styles['Heading2Custom']))
elements.append(Paragraph("• Pr = ν/α (Prandtl number)", styles['BodyText']))
elements.append(Paragraph("• λ = QL²/ν (heat generation parameter)", styles['BodyText']))
elements.append(Paragraph("• S = B/(T<sub>w</sub> − T<sub>0</sub>)·Gr<sup>1/2</sup> (stratification parameter)", styles['BodyText']))

elements.append(PageBreak())

# STEP 5
elements.append(Paragraph("<b>STEP 5: Similarity Transformation</b>", styles['Heading1Custom']))
elements.append(Paragraph("Introduce stream function and similarity variable:", styles['BodyText']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<i><b>ψ = x<sup>3/4</sup>·f(x,η),    η = x<sup>−1/4</sup>·y,    θ = θ(x,η)</b></i>", styles['Equation']))

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Velocity components:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i>u = ∂ψ/∂y = x<sup>1/2</sup>·f′(x,η)</i>", styles['Equation']))
elements.append(Paragraph("<i>v = −∂ψ/∂x = (1/4)x<sup>−1/4</sup>·[ηf′ − 3f] − x<sup>3/4</sup>·∂f/∂x</i>", styles['Equation']))

elements.append(PageBreak())

# STEP 6
elements.append(Paragraph("<b>STEP 6: Final ODE System</b>", styles['Heading1Custom']))
elements.append(Paragraph("After substituting similarity variables into PDEs:", styles['BodyText']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("<b>Momentum ODE:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>f′′′ + (3/4)f·f′′ − (1/2)(f′)² + θ = x(f′·∂f′/∂x − f′′·∂f/∂x)</b></i>", styles['Equation']))

elements.append(Paragraph("<b>Energy ODE:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>(1/Pr)θ′′ + (3/4)f·θ′ + λθ = x(f′·∂θ/∂x − θ′·∂f/∂x)</b></i>", styles['Equation']))

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Boundary Conditions:</b>", styles['Heading2Custom']))
elements.append(Paragraph("At η = 0: f = f′ = 0, θ = 1 − Sx", styles['BodyText']))
elements.append(Paragraph("As η → ∞: f′ → 0, θ → 0", styles['BodyText']))

elements.append(PageBreak())

# STEP 7
elements.append(Paragraph("<b>STEP 7: Engineering Quantities (Equation 26)</b>", styles['Heading1Custom']))
elements.append(Spacer(1, 0.2*inch))

elements.append(Paragraph("<b>Skin Friction Coefficient:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>½ Gr<sub>x</sub><sup>1/4</sup> C<sub>f</sub> = (∂u/∂Y)|<sub>Y=0</sub> = f′′(x,0)</b></i>", styles['Equation']))

elements.append(Spacer(1, 0.2*inch))
elements.append(Paragraph("<b>Nusselt Number:</b>", styles['Heading2Custom']))
elements.append(Paragraph("<i><b>Nu / Gr<sub>x</sub><sup>1/4</sup> = −(∂θ/∂Y)|<sub>Y=0</sub> = −θ′(x,0)</b></i>", styles['Equation']))

elements.append(PageBreak())

# Summary
elements.append(Paragraph("<b>SUMMARY: Complete Solution Process</b>", styles['Heading1Custom']))
elements.append(Spacer(1, 0.1*inch))

elements.append(Paragraph("1. Start with dimensional equations (continuity, momentum, energy)", styles['BodyText']))
elements.append(Paragraph("2. Define reference scales (L, ΔT, U based on Gr)", styles['BodyText']))
elements.append(Paragraph("3. Make variables dimensionless (x, y, u, v, θ)", styles['BodyText']))
elements.append(Paragraph("4. Substitute and simplify to get dimensionless PDEs", styles['BodyText']))
elements.append(Paragraph("5. Introduce similarity transformation (ψ, η)", styles['BodyText']))
elements.append(Paragraph("6. Convert PDEs to ODEs", styles['BodyText']))
elements.append(Paragraph("7. Solve ODEs numerically to get f(η) and θ(η)", styles['BodyText']))
elements.append(Paragraph("8. Calculate engineering quantities (C<sub>f</sub>, Nu)", styles['BodyText']))

elements.append(Spacer(1, 0.3*inch))
elements.append(Paragraph("<b>✓ This matches your handnotes pages 1-7 exactly!</b>", styles['Center']))

# Build PDF
doc.build(elements)
print(f"✓ Created: {pdf_file}")
print("\nClean PDF with proper mathematical notation!")

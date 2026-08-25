#!/usr/bin/env python3
"""Captures App Store Pentaguin, calquées sur la vraie UI (1290x2796)."""
import math, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT="/home/user/orca/projects/Pentaguin"; OUT="/tmp/store/out"; os.makedirs(OUT, exist_ok=True)
S=3                      # points -> pixels
CW,CH=393,852            # iPhone 16 Pro en points
C=dict(bg="#0C0E1A", card="#14192C", card2="#1A2038", line="#29344F",
       txt="#EAF0FB", dim="#8695AE", dim2="#6E7C94",
       amber="#FBBE4B", amberSoft="#33270D", mint="#2DE0A6", mintSoft="#0B2A20",
       ember="#EF9330", emberSoft="#2E1E0C", red="#E4655F", redSoft="#33191A", term="#05080F")
def hx(c,a=255):
    c=C.get(c,c).lstrip('#'); return (int(c[0:2],16),int(c[2:4],16),int(c[4:6],16),a)
F={"reg":"HankenGrotesk-Regular","med":"HankenGrotesk-Medium","semi":"HankenGrotesk-SemiBold",
   "bold":"HankenGrotesk-Bold","mono":"JetBrainsMono-Regular","monob":"JetBrainsMono-Bold"}
_fc={}
def font(n,s):
    k=(n,round(s,1))
    if k not in _fc: _fc[k]=ImageFont.truetype(f"{ROOT}/assets/fonts/{F[n]}.ttf", max(1,int(round(s*S))))
    return _fc[k]
def cut():
    im=Image.open(f"{ROOT}/assets/images/icon.png").convert("RGBA"); px=im.load()
    for y in range(im.height):
        for x in range(im.width):
            r,g,b,a=px[x,y]
            if (r-10)**2+(g-15)**2+(b-28)**2 < 34**2: px[x,y]=(r,g,b,0)
    return im
PEN=cut()
def pen(img,cx,cy,w):
    p=PEN.resize((int(w*S),int(w*S)),Image.LANCZOS)
    img.alpha_composite(p,(int(cx*S-p.width/2),int(cy*S-p.height/2)))
def rr(d,b,r,fill=None,outline=None,width=1):
    d.rounded_rectangle([b[0]*S,b[1]*S,b[2]*S,b[3]*S],radius=r*S,fill=fill,outline=outline,width=max(1,int(width*S)))
def tx(d,xy,s,n,sz,fill,anchor="la",ls=0):
    f=font(n,sz)
    if ls:
        w=sum(d.textlength(ch,font=f)+ls*S for ch in s)-ls*S
        x0=xy[0]*S
        if anchor[0]=="m": x0-=w/2
        elif anchor[0]=="r": x0-=w
        x,y=x0,xy[1]*S
        for ch in s:
            d.text((x,y),ch,font=f,fill=fill,anchor="l"+anchor[1]); x+=d.textlength(ch,font=f)+ls*S
        return
    d.text((xy[0]*S,xy[1]*S),s,font=f,fill=fill,anchor=anchor)
def tw(s,n,sz): return font(n,sz).getlength(s)/S
def wrap(s,n,sz,mw):
    out,cur=[],""
    for w in s.split():
        t=(cur+" "+w).strip()
        if tw(t,n,sz)<=mw: cur=t
        else:
            if cur: out.append(cur)
            cur=w
    if cur: out.append(cur)
    return out
def para(d,xy,s,n,sz,fill,mw,lh,anchor="la"):
    x,y=xy
    for l in wrap(s,n,sz,mw): tx(d,(x,y),l,n,sz,fill,anchor); y+=lh
    return y
def star(d,cx,cy,R,fill):
    p=[]
    for k in range(10):
        a=-math.pi/2+k*math.pi/5; r=R if k%2==0 else R*.42
        p.append(((cx+r*math.cos(a))*S,(cy+r*math.sin(a))*S))
    d.polygon(p,fill=fill)
def shield(d,cx,cy,r,fill):
    d.polygon([(cx*S,(cy-r)*S),((cx+r*.8)*S,(cy-r*.5)*S),((cx+r*.8)*S,(cy+r*.2)*S),
               (cx*S,(cy+r)*S),((cx-r*.8)*S,(cy+r*.2)*S),((cx-r*.8)*S,(cy-r*.5)*S)],fill=fill)
def flame(d,cx,cy,r,fill):
    d.polygon([(cx*S,(cy-r)*S),((cx+r*.8)*S,(cy+r*.1)*S),((cx+r*.5)*S,(cy+r*.9)*S),
               (cx*S,(cy+r)*S),((cx-r*.5)*S,(cy+r*.9)*S),((cx-r*.8)*S,(cy+r*.1)*S)],fill=fill)
def check(d,cx,cy,r,fill,w=2.2):
    d.line([(cx-r*.5)*S,cy*S,(cx-r*.1)*S,(cy+r*.5)*S],fill=fill,width=int(w*S))
    d.line([(cx-r*.1)*S,(cy+r*.5)*S,(cx+r*.6)*S,(cy-r*.5)*S],fill=fill,width=int(w*S))

def screen():
    img=Image.new("RGBA",(CW*S,CH*S),hx("bg")); return img,ImageDraw.Draw(img)
def statusbar(d,t="9:41"):
    rr(d,(CW/2-46,10,CW/2+46,29),10,fill=(0,0,0,255))
    tx(d,(22,11),t,"semi",13,hx("txt"))
    for i,h in enumerate([4,6,8,10]):
        d.rectangle([(CW-58+i*5)*S,(21-h)*S,(CW-58+i*5+3)*S,21*S],fill=hx("txt"))
    rr(d,(CW-33,12,CW-15,22),2.5,outline=hx("txt"),width=1)
    d.rectangle([(CW-31)*S,14*S,(CW-20)*S,20*S],fill=hx("txt"))
def tabbar(d,active=0):
    y=CH-64
    d.line([0,y*S,CW*S,y*S],fill=hx("line",120),width=int(1*S))
    labs=["Accueil","Apprendre","S'entraîner","Profil"]
    for i,l in enumerate(labs):
        cx=CW*(i+.5)/4; col=hx("amber") if i==active else hx("dim2")
        if i==0:
            d.polygon([(cx*S,(y+14)*S),((cx-9)*S,(y+22)*S),((cx+9)*S,(y+22)*S)],outline=col,width=int(1.8*S))
            rr(d,(cx-7,y+21,cx+7,y+30),1.5,outline=col,width=1.8)
        elif i==1:
            rr(d,(cx-9,y+14,cx-.5,y+29),1.5,outline=col,width=1.8); rr(d,(cx+.5,y+14,cx+9,y+29),1.5,outline=col,width=1.8)
        elif i==2:
            d.ellipse([(cx-9)*S,(y+14)*S,(cx+9)*S,(y+31)*S],outline=col,width=int(1.8*S))
            d.line([cx*S,(y+22)*S,cx*S,(y+17)*S],fill=col,width=int(1.8*S))
        else:
            d.ellipse([(cx-6)*S,(y+13)*S,(cx+6)*S,(y+25)*S],outline=col,width=int(1.8*S))
            d.arc([(cx-10)*S,(y+24)*S,(cx+10)*S,(y+38)*S],180,360,fill=col,width=int(1.8*S))
        tx(d,(cx,y+40),l,"semi",10,col,anchor="ma")
    rr(d,(CW/2-45,CH-10,CW/2+45,CH-7),2,fill=hx("dim2"))

# ---------------------------------------------------------------- 1. ACCUEIL
def s_home():
    img,d=screen(); statusbar(d)
    tx(d,(20,54),"PENTAGUIN","bold",11,hx("dim2"),ls=2.4)
    pen(img,56,116,78)
    tx(d,(104,92),"Salut, Nova.","bold",23,hx("txt"))
    tx(d,(104,122),"Prêt pour aujourd'hui ?","med",14,hx("dim"))

    # Objectif du jour
    rr(d,(16,158,CW-16,262),16,fill=hx("card"),outline=hx("line",150),width=1)
    cx,cy,r=58,210,28
    d.ellipse([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S],outline=hx("line"),width=int(5*S))
    d.arc([(cx-r)*S,(cy-r)*S,(cx+r)*S,(cy+r)*S],-90,270,fill=hx("mint"),width=int(5*S))
    check(d,cx,cy-1,10,hx("mint"),2.6)
    tx(d,(98,178),"Objectif du jour","semi",13,hx("dim"))
    tx(d,(98,196),"30","bold",27,hx("mint")); tx(d,(98+tw("30","bold",27)+5,207),"/ 30 XP","semi",14,hx("dim"))
    rr(d,(98,230,98+tw("Objectif atteint","semi",11)+30,249),9,fill=hx("mintSoft"))
    check(d,108,239,5,hx("mint"),1.8)
    tx(d,(117,233),"Objectif atteint","semi",11,hx("mint"))
    shield(d,CW-46,200,11,hx("amber")); tx(d,(CW-46,215),"×2","bold",11,hx("amber"),anchor="ma")

    # Cette semaine
    rr(d,(16,274,CW-16,356),16,fill=hx("card"),outline=hx("line",150),width=1)
    tx(d,(32,290),"CETTE SEMAINE","bold",10,hx("dim2"),ls=1.4)
    tx(d,(CW-32,290),"6/7 · 240 XP","semi",11,hx("dim"),anchor="ra")
    days=["L","M","M","J","V","S","D"]
    for i,dl in enumerate(days):
        x=32+i*47.6
        on=i<6
        rr(d,(x,312,x+36,338),8,fill=hx("amberSoft") if on else hx("card2"),
           outline=hx("amber") if i==6 else None,width=1.4)
        if on: check(d,x+18,324,7,hx("amber"),2)
        else: tx(d,(x+18,318),dl,"bold",12,hx("dim2"),anchor="ma")

    # Reprendre
    rr(d,(16,368,CW-16,474),16,fill=hx("card"),outline=hx("amber",90),width=1.4)
    d.polygon([(34*S,386*S),(34*S,396*S),(42*S,391*S)],fill=hx("amber"))
    tx(d,(48,385),"REPRENDRE","bold",10,hx("amber"),ls=1.4)
    tx(d,(CW-32,385),"ÉTAPE 5/8","bold",10,hx("dim2"),anchor="ra",ls=1.2)
    y=para(d,(32,408),"Détecter un phishing en 15 secondes","bold",18,hx("txt"),CW-64,23)
    tx(d,(32,y+6),"FONDAMENTAUX & HYGIÈNE · 5 MIN","mono",10,hx("dim2"))
    rr(d,(32,458,CW-32,463),3,fill=hx("card2")); rr(d,(32,458,32+(CW-64)*0.62,463),3,fill=hx("amber"))

    # Tuiles
    rr(d,(16,486,196,586),16,fill=hx("card"),outline=hx("line",150),width=1)
    tx(d,(32,504),"RANG","bold",10,hx("dim2"),ls=1.4)
    star(d,37,540,12,hx("amber"))
    tx(d,(56,527),"Or III","bold",22,hx("amber"))
    tx(d,(32,558),"Top 12 % des joueurs","med",11,hx("dim"))
    for bx,by,lab,val,col,ic in [(204,486,"XP TOTAL","4 820",hx("txt"),"x"),(204,536,"SÉRIE","12 jours",hx("ember"),"f")]:
        rr(d,(bx,by,CW-16,by+50),14,fill=hx("card"),outline=hx("line",150),width=1)
        tx(d,(bx+16,by+11),lab,"bold",10,hx("dim2"),ls=1.4)
        if ic=="f": flame(d,bx+22,by+32,8,hx("ember")); tx(d,(bx+34,by+24),val,"bold",17,col)
        else: tx(d,(bx+16,by+24),val,"bold",17,col)

    # CTA
    rr(d,(16,602,CW-16,656),14,fill=hx("amber"))
    tx(d,(CW/2,617),"Continuer ma leçon","bold",17,hx("bg"),anchor="ma")
    rr(d,(16,670,CW-16,752),16,fill=hx("card"),outline=hx("line",150),width=1)
    tx(d,(32,686),"À RÉVISER AUJOURD'HUI","bold",10,hx("dim2"),ls=1.4)
    tx(d,(32,704),"7 questions arrivent à échéance","semi",13.5,hx("txt"))
    tx(d,(32,724),"Révision espacée · 3 min","med",11.5,hx("dim"))
    chevron_fwd(d,CW-34,712,hx("amber"))
    tabbar(d,0); return img

# --------------------------------------------------------------- 2. PRATIQUE
def s_practice():
    img,d=screen(); statusbar(d)
    chevron_back(d); tx(d,(CW/2,52),"S'entraîner","bold",16,hx("txt"),anchor="ma")
    rr(d,(CW-72,46,CW-18,64),9,fill=hx("amberSoft"),outline=hx("amber",120),width=1)
    star(d,CW-62,55,5.5,hx("amber")); tx(d,(CW-54,49),"PRO","bold",10,hx("amber"),ls=1)
    tx(d,(20,84),"Missions","bold",19,hx("txt"))
    tx(d,(20,108),"Des enquêtes complètes, étape par étape.","med",12,hx("dim"))
    miss=[("Quart de nuit au SOC","Détecter, investiguer, répondre : une nuit de garde.",5,True),
          ("Anatomie d'une attaque","De la kill chain à la note de rançon.",5,False),
          ("Pentest sous mandat","Du cadre légal à la faille, dans les règles.",7,False)]
    y=128
    for i,(t_,sub,hue,done) in enumerate(miss):
        base=["#4C74AD","#4881AC","#458DAB","#4A98A9","#579FA6","#69A8AE","#7EB1BC","#93BCC9"][hue]
        rr(d,(16,y,CW-16,y+74),14,fill=hx("card"),outline=hx("line",150),width=1)
        rr(d,(30,y+14,60,y+44),9,fill=hx(base,40))
        if done: check(d,45,y+29,8,hx("mint"),2.2)
        else:
            d.line([40*S,(y+18)*S,40*S,(y+42)*S],fill=hx(base),width=int(2*S))
            d.polygon([(41*S,(y+18)*S),(56*S,(y+23)*S),(41*S,(y+29)*S)],fill=hx(base))
        tx(d,(70,y+16),t_,"bold",14,hx("txt"))
        para(d,(70,y+34),sub,"med",11.5,hx("dim"),CW-110,14)
        chevron_fwd(d,CW-32,y+29)
        tx(d,(30,y+54),"4 ÉTAPES · TERMINAL, LOGS, DÉCISION","mono",10,hx("dim2"))
        y+=82
    tx(d,(20,y+8),"Exercices","bold",19,hx("txt"))
    tx(d,(20,y+32),"32 exercices, tous débloqués avec Pro.","med",12,hx("dim"))
    y+=56
    exos=[("Analyse de logs : traque d'un brute-force SSH","Terminal · Pour ton rang",0,"term"),
          ("L'événement critique noyé dans le SIEM","Analyse d'artefact",3,"anal"),
          ("Le cycle de réponse à incident (SANS)","Remise en ordre",5,"ord"),
          ("Ransomware en cours : décisions","Scénario",6,"scen"),
          ("Inspecter un certificat avec openssl","Terminal",2,"term")]
    rr(d,(16,y,CW-16,y+4+len(exos)*62),14,fill=hx("card"),outline=hx("line",150),width=1)
    for i,(t_,sub,hue,k) in enumerate(exos):
        ly=y+8+i*62; base=["#4C74AD","#4881AC","#458DAB","#4A98A9","#579FA6","#69A8AE","#7EB1BC","#93BCC9"][hue]
        if i: d.line([70*S,(ly-4)*S,(CW-16)*S,(ly-4)*S],fill=hx("line",110),width=int(1*S))
        rr(d,(30,ly+8,60,ly+38),9,fill=hx(base,40))
        icon(d,k,45,ly+23,hx(base))
        para(d,(70,ly+8),t_,"semi",13,hx("txt"),CW-110,15)
        tx(d,(70,ly+38),sub,"med",11,hx("amber") if "rang" in sub else hx("dim"))
        chevron_fwd(d,CW-32,ly+23)
    tabbar(d,2); return img

def chevron_back(d,x=24,y=55):
    d.line([(x+5)*S,(y-6)*S,x*S,y*S],fill=hx("amber"),width=int(2*S))
    d.line([x*S,y*S,(x+5)*S,(y+6)*S],fill=hx("amber"),width=int(2*S))
def chevron_fwd(d,x,y,col=None):
    c=col or hx("dim2")
    d.line([(x-3)*S,(y-5)*S,(x+2)*S,y*S],fill=c,width=int(1.8*S))
    d.line([(x+2)*S,y*S,(x-3)*S,(y+5)*S],fill=c,width=int(1.8*S))
def icon(d,k,cx,cy,col):
    if k=="term":
        rr(d,(cx-8,cy-7,cx+8,cy+7),3,outline=col,width=1.6)
        d.line([(cx-5)*S,(cy-3)*S,(cx-2)*S,cy*S],fill=col,width=int(1.6*S))
        d.line([(cx-2)*S,cy*S,(cx-5)*S,(cy+3)*S],fill=col,width=int(1.6*S))
        d.line([(cx)*S,(cy+3)*S,(cx+5)*S,(cy+3)*S],fill=col,width=int(1.6*S))
    elif k=="anal":
        d.ellipse([(cx-8)*S,(cy-8)*S,(cx+3)*S,(cy+3)*S],outline=col,width=int(1.8*S))
        d.line([(cx+2)*S,(cy+2)*S,(cx+8)*S,(cy+8)*S],fill=col,width=int(2*S))
    elif k=="ord":
        d.line([(cx-5)*S,(cy-7)*S,(cx-5)*S,(cy+7)*S],fill=col,width=int(1.8*S))
        d.polygon([((cx-5)*S,(cy-8)*S),((cx-8)*S,(cy-4)*S),((cx-2)*S,(cy-4)*S)],fill=col)
        d.line([(cx+5)*S,(cy-7)*S,(cx+5)*S,(cy+7)*S],fill=col,width=int(1.8*S))
        d.polygon([((cx+5)*S,(cy+8)*S),((cx+2)*S,(cy+4)*S),((cx+8)*S,(cy+4)*S)],fill=col)
    else:
        d.ellipse([(cx-8)*S,(cy-8)*S,(cx-3)*S,(cy-3)*S],outline=col,width=int(1.8*S))
        d.ellipse([(cx+3)*S,(cy+3)*S,(cx+8)*S,(cy+8)*S],outline=col,width=int(1.8*S))
        d.ellipse([(cx+3)*S,(cy-8)*S,(cx+8)*S,(cy-3)*S],outline=col,width=int(1.8*S))
        d.line([(cx-5)*S,(cy-3)*S,(cx-5)*S,(cy+5)*S],fill=col,width=int(1.6*S))
        d.line([(cx-5)*S,(cy+5)*S,(cx+3)*S,(cy+5)*S],fill=col,width=int(1.6*S))
        d.line([(cx-5)*S,(cy-5)*S,(cx+3)*S,(cy-5)*S],fill=col,width=int(1.6*S))

# --------------------------------------------------------------- 3. TERMINAL
def s_terminal():
    img,d=screen(); statusbar(d); chevron_back(d)
    tx(d,(CW/2,52),"Terminal","bold",16,hx("txt"),anchor="ma")
    tx(d,(20,80),"Analyse de logs : traque d'un","bold",18,hx("txt"))
    tx(d,(20,102),"brute-force SSH","bold",18,hx("txt"))
    rr(d,(20,130,20+tw("ÉTAPE 2 / 4","bold",10)+22,150),8,fill=hx("card2"))
    tx(d,(31,133),"ÉTAPE 2 / 4","bold",10,hx("dim"),ls=1)
    y=para(d,(20,164),"Compte les tentatives par IP source pour désigner l'attaquant : extrais l'adresse IP avec awk, puis agrège.","semi",13.5,hx("txt"),CW-40,18)
    ty=y+12
    rr(d,(16,ty,CW-16,ty+296),12,fill=hx("term"))
    lines=[("analyst@soc:~$ grep \"Failed password\" /var/log/auth.log","amber"),
           ("Jul 20 08:16:03 srv-app01 sshd[20455]: Failed","mint"),
           ("password for invalid user admin from 203.0.113.66","mint"),
           ("Jul 20 08:16:07 srv-app01 sshd[20457]: Failed","mint"),
           ("password for root from 203.0.113.66 port 51044","mint"),
           ("Jul 20 08:16:11 srv-app01 sshd[20461]: Failed","mint"),
           ("password for backup from 203.0.113.66 port 51070","mint"),
           ("... (312 lignes correspondantes)","dim")]
    ly=ty+12
    for s,c in lines:
        tx(d,(28,ly),s,"mono",9.5,hx({"amber":"amber","mint":"mint","dim":"dim2"}[c])); ly+=15
    ly+=8
    tx(d,(28,ly),"analyst@soc:~$","mono",10,hx("amber"))
    comp=["grep","\"Failed password\"","/var/log/auth.log","|","awk"]
    cx_,cy_=28,ly+20
    for tkn in comp:
        w=tw(tkn,"mono",10)+10
        if cx_+w>CW-30: cx_=28; cy_+=20
        rr(d,(cx_,cy_,cx_+w,cy_+17),4,fill=hx("card2"),outline=hx("amber",120),width=1)
        tx(d,(cx_+5,cy_+3),tkn,"mono",10,hx("txt")); cx_+=w+5
    rr(d,(cx_+1,cy_+2,cx_+3,cy_+15),1,fill=hx("amber"))
    py=ty+310
    tx(d,(20,py),"COMPOSE LA COMMANDE","bold",10,hx("dim2"),ls=1.4)
    pool=["'{print $(NF-3)}'","sort","|","uniq","-c","cut","-rn","wc","head","-l","awk","tail"]
    px,pyy=20,py+18
    for tkn in pool:
        w=tw(tkn,"mono",11)+18
        if px+w>CW-20: px=20; pyy+=32
        rr(d,(px,pyy,px+w,pyy+27),7,fill=hx("card"),outline=hx("line"),width=1)
        tx(d,(px+9,pyy+6),tkn,"mono",11,hx("txt")); px+=w+8
    hy=pyy+44
    rr(d,(16,hy,CW-16,hy+64),12,fill=hx("card"),outline=hx("line"),width=1)
    tx(d,(32,hy+14),"INDICE","bold",10,hx("amber"),ls=1.4)
    para(d,(32,hy+32),"awk isole la colonne voulue, sort | uniq -c agrège, sort -rn classe.","med",12,hx("dim"),CW-64,15)
    rr(d,(16,CH-118,CW-16,CH-66),12,fill=hx("amber"))
    tx(d,(CW/2,CH-104),"Exécuter","bold",16,hx("bg"),anchor="ma")
    tx(d,(CW/2,CH-52),"Passer au clavier","semi",12,hx("dim"),anchor="ma")
    rr(d,(CW/2-45,CH-30,CW/2+45,CH-27),2,fill=hx("dim2")); return img

# ---------------------------------------------------------------- 4. MISSION
def s_mission():
    img,d=screen(); statusbar(d); chevron_back(d)
    tx(d,(CW/2,52),"Mission","bold",16,hx("txt"),anchor="ma")
    rr(d,(16,78,CW-16,168),16,fill=hx("card"),outline=hx("line",150),width=1)
    tx(d,(32,94),"MISSION 07 · DÉFENSE / SOC","bold",10,hx("amber"),ls=1.4)
    tx(d,(32,112),"Quart de nuit au SOC","bold",21,hx("txt"))
    para(d,(32,140),"Détecter, investiguer, répondre : une nuit de garde au SOC.","med",12.5,hx("dim"),CW-64,16)
    for i in range(4):
        x=20+i*(CW-40)/4
        w=(CW-40)/4-8
        col=hx("mint") if i<2 else (hx("amber") if i==2 else hx("card2"))
        rr(d,(x,184,x+w,190),3,fill=col)
    tx(d,(20,200),"ÉTAPE 3 / 4","bold",11,hx("amber"),ls=1.2)
    tx(d,(CW-20,200),"12 min","mono",11,hx("dim2"),anchor="ra")
    rr(d,(16,226,CW-16,330),14,fill=hx("card2"))
    tx(d,(32,242),"ALERTE SIEM · 03:14","mono",10,hx("red"))
    y=para(d,(32,262),"312 échecs SSH depuis 203.0.113.66, puis une connexion acceptée sur le compte « backup ».","semi",13.5,hx("txt"),CW-64,18)
    tx(d,(32,y+8),"Quelle est ta première action ?","bold",14,hx("amber"))
    ans=[("Isoler SRV-APP01 du réseau et préserver la mémoire vive.",True),
         ("Redémarrer le serveur pour couper la session.",False),
         ("Changer le mot de passe de « backup » et attendre.",False)]
    yy=346
    for txt_,good in ans:
        lines_=wrap(txt_,"med",13,CW-96)
        h=18+len(lines_)*17
        rr(d,(16,yy,CW-16,yy+h),12,fill=hx("mintSoft") if good else hx("card"),
           outline=hx("mint") if good else hx("line"),width=1.4 if good else 1)
        if good: check(d,36,yy+h/2-1,7,hx("mint"),2)
        else: d.ellipse([28*S,(yy+h/2-8)*S,44*S,(yy+h/2+8)*S],outline=hx("dim2"),width=int(1.4*S))
        ly=yy+9
        for l in lines_: tx(d,(56,ly),l,"med",13,hx("txt")); ly+=17
        yy+=h+10
    rr(d,(16,yy+8,CW-16,yy+142),12,fill=hx("mintSoft"))
    tx(d,(32,yy+24),"BONNE RÉPONSE","bold",10,hx("mint"),ls=1.4)
    rr(d,(CW-88,yy+20,CW-32,yy+38),8,fill=hx("bg",170))
    tx(d,(CW-60,yy+23),"+40 XP","bold",11,hx("mint"),anchor="ma")
    yb=para(d,(32,yy+44),"L'isolement réseau stoppe l'attaquant sans détruire les preuves. Un redémarrage effacerait la RAM, et donc les traces du reverse shell.","med",12.5,hx("txt"),CW-64,16)
    d.line([32*S,(yb+8)*S,(CW-32)*S,(yb+8)*S],fill=hx("mint",70),width=int(1*S))
    tx(d,(32,yb+16),"NIST SP 800-61 · confinement avant éradication","mono",10,hx("mint"))
    ny=yy+156
    rr(d,(16,ny,CW-16,ny+72),12,fill=hx("card"),outline=hx("line",150),width=1)
    tx(d,(32,ny+14),"ÉTAPE 4 · RAPPORT DE MISSION","bold",10,hx("dim2"),ls=1.4)
    para(d,(32,ny+32),"Rédige le compte rendu : chronologie, portée, recommandations.","med",12.5,hx("dim"),CW-70,16)
    rr(d,(16,CH-88,CW-16,CH-40),12,fill=hx("amber"))
    tx(d,(CW/2,CH-75),"Étape suivante","bold",16,hx("bg"),anchor="ma")
    rr(d,(CW/2-45,CH-26,CW/2+45,CH-23),2,fill=hx("dim2")); return img

# ----------------------------------------------------------------- 5. LEÇON
def s_lesson():
    img,d=screen(); statusbar(d); chevron_back(d)
    tx(d,(CW/2,52),"Leçon","bold",16,hx("txt"),anchor="ma")
    rr(d,(20,76,CW-20,82),3,fill=hx("card2")); rr(d,(20,76,20+(CW-40)*0.5,82),3,fill=hx("amber"))
    tx(d,(20,92),"CRYPTOGRAPHIE · 4/8","mono",10,hx("dim2"))
    pen(img,52,150,64)
    rr(d,(90,116,CW-20,196),14,fill=hx("card"),outline=hx("line",150),width=1)
    d.polygon([(90*S,140*S),(82*S,148*S),(90*S,156*S)],fill=hx("card"))
    para(d,(104,130),"En 2012, LinkedIn s'est fait voler 6,5 millions de mots de passe. Ils étaient « chiffrés »… en SHA-1 sans sel.","med",13,hx("txt"),CW-140,17)
    rr(d,(16,214,CW-16,246),10,fill=hx("amberSoft"))
    tx(d,(30,222),"À TON AVIS ?","bold",11,hx("amber"),ls=1.4)
    y=para(d,(20,262),"Pourquoi le sel rend-il un vol de base de mots de passe beaucoup moins rentable ?","bold",16,hx("txt"),CW-40,21)
    ans=[("Il rend chaque hash unique : les rainbow tables ne servent plus à rien.",True),
         ("Il rallonge le mot de passe, donc il devient plus dur à deviner.",False),
         ("Il chiffre le hash avec une clé secrète stockée à part.",False)]
    yy=y+16
    for txt_,good in ans:
        lines_=wrap(txt_,"med",13,CW-96)
        h=18+len(lines_)*17
        rr(d,(16,yy,CW-16,yy+h),12,fill=hx("mintSoft") if good else hx("card"),
           outline=hx("mint") if good else hx("line"),width=1.4 if good else 1)
        if good: check(d,36,yy+h/2-1,7,hx("mint"),2)
        else: d.ellipse([28*S,(yy+h/2-8)*S,44*S,(yy+h/2+8)*S],outline=hx("dim2"),width=int(1.4*S))
        ly=yy+9
        for l in lines_: tx(d,(56,ly),l,"med",13,hx("txt")); ly+=17
        yy+=h+10
    rr(d,(16,yy+8,CW-16,yy+176),12,fill=hx("card"),outline=hx("mint",120),width=1.4)
    tx(d,(32,yy+24),"BIEN VU","bold",10,hx("mint"),ls=1.4)
    rr(d,(CW-88,yy+20,CW-32,yy+38),8,fill=hx("mintSoft"))
    tx(d,(CW-60,yy+23),"+15 XP","bold",11,hx("mint"),anchor="ma")
    yb=para(d,(32,yy+44),"Sans sel, un seul calcul casse tous les comptes qui partagent le même mot de passe. Avec un sel unique, l'attaquant doit repartir de zéro pour chaque ligne de la base.","med",12.5,hx("txt"),CW-64,16)
    d.line([32*S,(yb+10)*S,(CW-32)*S,(yb+10)*S],fill=hx("line"),width=int(1*S))
    tx(d,(32,yb+18),"À retenir : bcrypt / argon2id salent et ralentissent","med",12,hx("dim"))
    tx(d,(32,yb+36),"le calcul. SHA-1 seul n'est pas fait pour ça.","med",12,hx("dim"))
    rr(d,(16,CH-88,CW-16,CH-40),12,fill=hx("amber"))
    tx(d,(CW/2,CH-75),"Continuer","bold",16,hx("bg"),anchor="ma")
    rr(d,(CW/2-45,CH-26,CW/2+45,CH-23),2,fill=hx("dim2")); return img

# ------------------------------------------------------------------ 6. RANGS
def s_ranks():
    img,d=screen(); statusbar(d); chevron_back(d)
    tx(d,(CW/2,52),"Ton rang","bold",16,hx("txt"),anchor="ma")
    rr(d,(16,78,CW-16,244),18,fill=hx("card"),outline=hx("amber",90),width=1.4)
    cx,cy=CW/2,142
    d.ellipse([(cx-42)*S,(cy-42)*S,(cx+42)*S,(cy+42)*S],fill=hx("amberSoft"))
    d.ellipse([(cx-42)*S,(cy-42)*S,(cx+42)*S,(cy+42)*S],outline=hx("amber"),width=int(2*S))
    for k in range(3): star(d,cx-22+k*22,cy-4,11,hx("amber"))
    tx(d,(cx,cy+14),"OR","bold",13,hx("amber"),anchor="ma",ls=2)
    tx(d,(cx,192),"Or III","bold",26,hx("txt"),anchor="ma")
    tx(d,(cx,222),"Rang 9 sur 15 · Top 12 %","med",12.5,hx("dim"),anchor="ma")
    tx(d,(20,262),"PROGRESSION VERS PLATINE I","bold",10,hx("dim2"),ls=1.4)
    rr(d,(20,282,CW-20,292),5,fill=hx("card2")); rr(d,(20,282,20+(CW-40)*0.68,292),5,fill=hx("amber"))
    tx(d,(20,300),"4 820 XP","semi",12,hx("txt")); tx(d,(CW-20,300),"7 000 XP","semi",12,hx("dim"),anchor="ra")
    tx(d,(20,336),"Classement de la semaine","bold",17,hx("txt"))
    tx(d,(20,360),"Ligue Or · 30 joueurs","med",12,hx("dim"))
    rows=[(1,"Kernel_Fox","1 240",False),(2,"n0ct4mbule","1 105",False),
          (3,"Nova","980",True),(4,"packet_lily","870",False),(5,"sudo_marin","755",False),
          (6,"tcp_flynn","690",False),(7,"mireille_hash","612",False)]
    y=386
    rr(d,(16,y,CW-16,y+len(rows)*54+6),14,fill=hx("card"),outline=hx("line",150),width=1)
    for i,(rk,name,xp,me) in enumerate(rows):
        ly=y+8+i*54
        if i: d.line([64*S,(ly-4)*S,(CW-16)*S,(ly-4)*S],fill=hx("line",110),width=int(1*S))
        if me: rr(d,(22,ly-2,CW-22,ly+46),10,fill=hx("amberSoft"))
        col=hx("amber") if rk<=3 else hx("dim")
        tx(d,(42,ly+12),str(rk),"bold",16,col,anchor="ma")
        d.ellipse([58*S,(ly+6)*S,90*S,(ly+38)*S],fill=hx("card2"))
        tx(d,(74,ly+14),name[0].upper(),"bold",14,hx("dim"),anchor="ma")
        tx(d,(100,ly+13),name,"semi" if not me else "bold",14,hx("amber") if me else hx("txt"))
        tx(d,(CW-34,ly+13),xp+" XP","mono",12,hx("dim"),anchor="ra")
    tabbar(d,3); return img

# ------------------------------------------------------- MONTAGE APP STORE
AW,AH=1290,2796
def glow(img,cx,cy,r,col,a):
    l=Image.new("RGBA",img.size,(0,0,0,0)); ImageDraw.Draw(l).ellipse([cx-r,cy-r,cx+r,cy+r],fill=col+(a,))
    img.alpha_composite(l.filter(ImageFilter.GaussianBlur(r*0.42)))
def rich(draw,x,y,parts,f,base,acc):
    for s,is_acc in parts:
        draw.text((x,y),s,font=f,fill=acc if is_acc else base); x+=draw.textlength(s,font=f)
def rich_w(draw,parts,f): return sum(draw.textlength(s,font=f) for s,_ in parts)
def parse(line):
    out=[];
    for i,chunk in enumerate(line.split("*")):
        if chunk: out.append((chunk,i%2==1))
    return out
def compose(scr,eyebrow,head):
    a=Image.new("RGBA",(AW,AH),hx("bg")); dr=ImageDraw.Draw(a)
    glow(a,AW//2,340,760,(251,190,75),34); glow(a,AW//2,2500,900,(45,224,166),12)
    fe=ImageFont.truetype(f"{ROOT}/assets/fonts/{F['bold']}.ttf",30)
    x=AW//2-(sum(dr.textlength(c,font=fe)+7 for c in eyebrow)-7)/2
    for c in eyebrow: dr.text((x,168),c,font=fe,fill=hx("amber")); x+=dr.textlength(c,font=fe)+7
    fh=ImageFont.truetype(f"{ROOT}/assets/fonts/{F['bold']}.ttf",92)
    yy=232
    for line in head.split("\n"):
        p=parse(line); rich(dr,(AW-rich_w(dr,p,fh))/2,yy,p,fh,hx("txt"),hx("amber")); yy+=104
    # device
    sw=int(AW*0.784); sh=int(sw*CH/CW)
    body=scr.resize((sw,sh),Image.LANCZOS)
    fx,fy=(AW-sw)//2,506
    sd=Image.new("RGBA",a.size,(0,0,0,0))
    ImageDraw.Draw(sd).rounded_rectangle([fx-16,fy-10,fx+sw+16,fy+sh+30],radius=76,fill=(0,0,0,150))
    a.alpha_composite(sd.filter(ImageFilter.GaussianBlur(26)))
    fr=Image.new("RGBA",(sw+22,sh+22),(0,0,0,0))
    ImageDraw.Draw(fr).rounded_rectangle([0,0,sw+21,sh+21],radius=76,fill=(30,38,58,255))
    a.alpha_composite(fr,(fx-11,fy-11))
    mask=Image.new("L",(sw,sh),0); ImageDraw.Draw(mask).rounded_rectangle([0,0,sw-1,sh-1],radius=66,fill=255)
    a.paste(body,(fx,fy),mask)
    return a.convert("RGB")

SHOTS=[(s_home,"APPRENDS EN JOUANT","Ta cybersécurité,\n*5 minutes* par jour"),
       (s_practice,"PENTAGUIN PRO","Toute la pratique\n*débloquée*"),
       (s_terminal,"PRATIQUE EN SITUATION","Un vrai terminal,\n*sans le clavier*"),
       (s_mission,"PENTAGUIN PRO","Des missions\n*comme au SOC*"),
       (s_lesson,"LEÇONS INTERACTIVES","Tu *paries*\navant d'apprendre"),
       (s_ranks,"PROGRESSION","15 rangs\nà *gravir*")]
for i,(fn,eb,hd) in enumerate(SHOTS,1):
    scr=fn()
    scr.convert("RGB").save(f"{OUT}/raw-{i}.png")
    compose(scr,eb,hd).save(f"{OUT}/{i:02d}-{fn.__name__[2:]}.png",optimize=True)
    print("ok",i,fn.__name__)

# 6,5" (1242x2688) dérivé
import glob as _g
for f in sorted(_g.glob(f"{OUT}/0*.png")):
    if "-65" in f: continue
    im=Image.open(f); w,h=1242,2688
    sc=Image.new("RGB",(w,h),(12,14,26))
    r=im.resize((w,int(w*AH/AW)),Image.LANCZOS)
    sc.paste(r,(0,(h-r.height)//2))
    sc.save(f.replace(".png","-65.png"),optimize=True)
print("6.5in ok")

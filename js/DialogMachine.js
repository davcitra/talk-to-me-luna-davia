import TalkMachine from '../talk-to-me-core/js/TalkMachine.js';

export default class DialogMachine extends TalkMachine {
  constructor() {
    super();
    this.initDialogMachine();
  }

  initDialogMachine() {
    this.dialogStarted = false;
    this.lastState = '';
    this.nextState = '';
    this.waitingForUserInput = true;
    this.stateDisplay = document.querySelector('#state-display');
    this.shouldContinue = false;

    // initialiser les éléments de la machine de dialogue
    this.maxLeds = 8;
    this.ui.initLEDUI();

    // Registre des états des boutons - simple array: 0 = released, 1 = pressed
    this.buttonStates = [0, 0, 0, 0, 0, 0];
    //black, white, red, green, blue, magenta, yellow, cyan, orange, purple, pink
    this.colors = ['yellow', 'orange', 'pink'];
    this.buttonColors = [-1, -1, -1, -1, -1, -1];
    this.restartOk = false;

    this.research = new Audio('audio/research.mp3');
    this.restart = new Audio('audio/restart.mp3');
    this.turnOff = new Audio('audio/turn_off.mp3');
    this.turnOn = new Audio('audio/turn_on.mp3');
    this.validation = new Audio('audio/validation.mp3');

  }

  /* CONTRÔLE DU DIALOGUE */
  startDialog() {
    this.dialogStarted = true;
    this.waitingForUserInput = true;
    // éteindre toutes les LEDs
    // this.ledsAllOff(); //!!!
    // effacer la console
    this.fancyLogger.clearConsole();
    // ----- initialiser les variables spécifiques au dialogue -----
    this.nextState = 'initialisation';
    this.buttonPressCounter = 0;
    // Préréglages de voix [index de voix, pitch, vitesse]
    this.preset_voice_normal = [192, 1, 0.8]; // [voice index, pitch, rate]
    // ----- démarrer la machine avec le premier état -----
    this.dialogFlow();
  }

  /* FLUX DU DIALOGUE */
  /**
   * Fonction principale du flux de dialogue
   * @param {string} eventType - Type d'événement ('default', 'pressed', 'released', 'longpress')
   * @param {number} button - Numéro du bouton (0-6) !!! 9 avant
   * @private
   */
  dialogFlow(eventType = 'default', button = -1) {
    if (!this.performPreliminaryTests()) {
      // premiers tests avant de continuer vers les règles
      return;
    }
    this.stateUpdate();

    /**
     * ═══════════════════════════════════════════════════════════════════════════
     * Flow du DIALOGUE - Guide visuel du flux de conversation
     * ═══════════════════════════════════════════════════════════════════════════
     *
     * initialisation → welcome → choose-color ─┬→ choose-blue → can-speak → count-press → toomuch → enough-pressed
     *                                           │
     *                                           └→ choose-yellow ──┘ (boucle vers choose-color)
     *
     * CONCEPTS CLÉS DE DIALOGUE DÉMONTRÉS:
     * ✓ Progression linéaire: États qui s'enchaînent (initialisation → welcome)
     * ✓ Embranchement: Le choix de l'utilisateur crée différents chemins (choose-color se divise selon le bouton)
     * ✓ Boucles: La conversation peut retourner à des états précédents (choose-yellow boucle)
     * ✓ Mémoire d'état: Le système se souvient des interactions précédentes (buttonPressCounter)
     * ✓ Initiative système: La machine parle sans attendre d'entrée (can-speak)
     *
     * MODIFIEZ LE DIALOGUE CI-DESSOUS - Ajoutez de nouveaux états dans le switch/case
     * ═══════════════════════════════════════════════════════════════════════════
     */

    switch (this.nextState) {
      case 'initialisation': //00 INIT
        // CONCEPT DE DIALOGUE: État de configuration - prépare le système avant l'interaction
        this.ledsAllOff();
        // this.nextState = 'welcome';
        this.nextState = 'veille';
        this.fancyLogger.logMessage('initialisation done');
        this.goToNextState();
        break;

      // case 'welcome': //A SUPPRIMER
      //   // CONCEPT DE DIALOGUE: Salutation - établit le contexte et définit les attentes
      //   this.ledsAllChangeColor('black'); //,1 pur blink avant
      //   this.ledChangeColor(6, 'white') //mettre low opacity
      //   // this.fancyLogger.logMessage(
      //   //   'Change your sequence',
      //   // );
      //   // this.nextState = 'choose-color';
      //   // if (button == 6) { }
      //   this.nextState = 'select-orders';
      //   break;
      //   ;

      case 'veille': //01 VEILLE
        // this.fancyLogger.logMessage('veille');
        for (let i = 0; i < 6; i++) {
          this.ledChangeColor(i, 'black'); //,1 pur blink avant
        }

        //purple, pink.
        this.ledChangeColor(6, 'purple', 0); //mettre low opacity
        this.ledChangeColor(7, 'purple', 0); //mettre low opacity
        // this.ledChangeColor(6, 'white', 0); //mettre low opacity
        // this.fancyLogger.logMessage(
        //   'Press to turn on the game',
        // );

        // this.nextState = 'veille';

        if (button != 6) { //adapter en longpress seulement
          // this.ledsAllChangeColor('black'); //,1 pur blink avant
          // this.ledChangeColor(6, 'white'); //mettre low opacity
          this.nextState = 'veille';
          this.goToNextState();
        }
        if (button == 6 && this.restart == false) { // ///???
          this.nextState = 'allumage';
          this.goToNextState();
          break;
        }

        ;

      case 'allumage': //02 ALLUMAGE
        //bruit allumage

        this.fancyLogger.logMessage('allumage');
        this.ledChangeColor(6, 'white');
        this.ledChangeColor(7, 'white');
        if (this.turnOn.paused) {
          this.turnOn.volume = 1;
          this.turnOn.play();
        }
        // this.ledsAllChangeColor('white'); //low opacity

        setTimeout(() => {

          this.ledChangeColor(6, 'white', 2); //full opacity
          this.ledChangeColor(7, 'white', 2); //full opacity
        }, 1500); //1000

        //after Delay;

        //TEXTE DEBUT EXPLICATION
        setTimeout(() => {
          this.speechText(
            'Gimme three ! Work together to get the same color code, using your three buttons. Press the main button to compare and adjust until your colors match !',
            [192, 1, 0.8],
          );
        }, 1000); //1000

        setTimeout(() => {
          this.nextState = 'select-orders';
          this.goToNextState();
        }, 13000); //12850
        break;
        ;



      //03 DELAY



      case 'select-orders': //04 ON PRESSED
        // this.fancyLogger.logMessage('select');
        this.ledChangeColor(6, 'white'); //change to low intensity
        this.ledChangeColor(7, 'white'); //change to low intensity

        if (button == 0) {
          // this.nextState = 'choose-blue';
          // this.fancyLogger.logMessage(
          //   'player 1 changed their first led color',
          // );
          this.buttonColors[0] += 1;
          this.changeColor = (this.buttonColors[0] % 3);

          this.ledChangeColor(0, this.colors[this.changeColor]);
          // this.goToNextState();
          this.nextState = 'select-orders';
          this.goToNextState();
        }

        if (button == 1) {

          // this.fancyLogger.logMessage(
          //   'player 1 changed their second led color',
          // );
          this.buttonColors[1] += 1;
          this.changeColor = (this.buttonColors[1] % 3);
          this.ledChangeColor(1, this.colors[this.changeColor]);
          this.nextState = 'select-orders';
          this.goToNextState();
        }
        if (button == 2) {
          // this.fancyLogger.logMessage(
          //   'player 1 changed their third led color',
          // );
          this.buttonColors[2] += 1;
          this.changeColor = (this.buttonColors[2] % 3);
          this.ledChangeColor(2, this.colors[this.changeColor]);
          this.nextState = 'select-orders';
          this.goToNextState();
        }

        if (button == 3) {
          // this.fancyLogger.logMessage(
          //   'player 2 changed their first led color',
          // );
          this.buttonColors[3] += 1;
          this.changeColor = (this.buttonColors[3] % 3);
          this.ledChangeColor(3, this.colors[this.changeColor]);
          this.nextState = 'select-orders';
          this.goToNextState();
        }

        if (button == 4) {
          // this.fancyLogger.logMessage(
          //   'player 2 changed their second led color',
          // );
          this.buttonColors[4] += 1;
          this.changeColor = (this.buttonColors[4] % 3);
          this.ledChangeColor(4, this.colors[this.changeColor]);
          this.nextState = 'select-orders';
          this.goToNextState();
        }
        if (button == 5) {
          // this.fancyLogger.logMessage(
          //   'player 2 changed their third led color',
          // );
          this.buttonColors[5] += 1;
          this.changeColor = (this.buttonColors[5] % 3);
          this.ledChangeColor(5, this.colors[this.changeColor]);
          this.nextState = 'select-orders';
          this.goToNextState();
        }

        this.complete = false;

        if (this.buttonColors[0] !== -1 && this.buttonColors[1] !== -1 && this.buttonColors[2] !== -1 && this.buttonColors[3] !== -1 && this.buttonColors[4] !== -1 && this.buttonColors[5] !== -1) {
          this.complete = true;
        }


        if (button == 6 && this.restartOk == false && eventType !== 'longpress') {

          if (this.complete == false) {
            this.nextState = 'incomplete';
            this.goToNextState();
          };

          if (this.complete == true) {
            if (this.research.paused) {
              this.research.volume = 1;
              this.research.play();
            }

            // this.playAudioFile('./audio/validation.mp3')
            this.fancyLogger.logMessage(
              'both players are validating their sequences',
            );

            this.nextState = 'check-same';
            this.goToNextState();
          };


        }
        break;


      case 'incomplete':
        this.speechText(
          `Colors incomplete`, //REFORMULER CA
          [192, 1, 0.8],
        );
        this.nextState = 'select-orders';
        this.goToNextState();
        break;

        ;

      case 'check-same': //05 VALIDATION
        //AJOUTER SON DE RECHERCHE

        // this.ledsAllChangeColor('white', 2);
        this.ledChangeColor(6, 'white', 1); //changer en variation rapide de calcul
        this.ledChangeColor(7, 'white', 1); //changer en variation rapide de calcul

        for (let i = 0; i < 6; i++) {
          this.changeColor = (this.buttonColors[i] % 3);
          // this.ledChangeColor(5, this.colors[this.changeColor]);
          this.ledChangeColor(i, this.colors[this.changeColor], 1); //changer en variation rapide de calcul dégradé
        }

        // this.ledChangeColor(3, 'white', 2);
        // setTimeout(() => {
        //   this.ledChangeColor(4, 'white', 2);
        //   setTimeout(() => {
        //     this.ledChangeColor(5, 'white', 2);
        //   }, 1000);
        // }, 1000);

        this.similarities = 0;
        // for (let i = 0; i < 3; i++) {
        //   if (this.buttonColors[i] % 3 == this.buttonColors[i + 3] % 3) {
        //     this.similarities += 1;
        //   }
        // };

        if (this.buttonColors[0] % 3 == this.buttonColors[5] % 3) {
          this.similarities += 1;
        }
        if (this.buttonColors[1] % 3 == this.buttonColors[4] % 3) {
          this.similarities += 1;
        }
        if (this.buttonColors[2] % 3 == this.buttonColors[3] % 3) {
          this.similarities += 1;
        }

        this.fancyLogger.logMessage(
          `calculating similarities...`,
        );

        setTimeout(() => { //mettre dans un nouveau case de fin de recherche

          if (this.validation.paused) {
            this.validation.volume = 1;
            this.validation.play();
          }
          if (this.similarities != 3) {
            // this.ledChangeColor(6, 'white', 2);
            this.nextState = 'continue';
            this.goToNextState();

          } else {
            // this.ledChangeColor(6, 'white', 2);
            this.nextState = 'win';
            this.goToNextState();
          }
        }, 3000);
        break;


        ;



      case 'end-calcul': //06 DELAY
        //AJOUT SON FIN CALCUL

        ;


      case 'win': //07 GAGNÉ
        // this.fancyLogger.logMessage(
        //   `Well Doooone`);
        this.fancyLogger.logMessage(
          `win`);
        for (let i = 0; i < 6; i++) {
          this.ledChangeColor(i, 'white', 1);
        }
        this.ledChangeColor(6, 'white', 2);
        this.ledChangeColor(7, 'white', 2);

        this.speakNormal('It\'s a match ! You\'re so connected.');

        // setTimeout(() => {
        //   this.speechText(
        //     'Enough is enough! I dont want to be pressed anymore!',
        //     [192, 1, 0.8],
        //   );
        // }, 3000);

        // this.ledsAllChangeColor('green', 1);

        setTimeout(() => {
          this.nextState = 'party';
          this.goToNextState();
        }, 3500)

        break;

        ;

      case 'continue': //08 PERDU

        // this.fancyLogger.logMessage(
        //   `You have ${this.similarities} similarities between your sequences`);


        for (let i = 0; i < 6; i++) {
          this.ledChangeColor(i, this.colors[this.buttonColors[i] % 3]);
        }
        this.ledChangeColor(6, 'white', 2);
        this.ledChangeColor(7, 'white', 2);

        // this.fancyLogger.logMessage(
        //   'You are not there yet, modify your sequence again',
        // );

        this.fancyLogger.logMessage(
          'You are not there yet, modify your sequence again',
        );

        this.delay = 0;

        setTimeout(() => {
          this.ledChangeColor(6, 'white', 2);
          this.ledChangeColor(7, 'white', 2);
          if (this.similarities == 0) {

            this.speechText(
              `Nothing in common, what a shame…`,
              [192, 1, 0.8],
            );
            this.delay = 4000;
          };
          if (this.similarities == 1) {

            this.speechText(
              `Only one common color. Try again !`, //maybe retarder un peu
              [192, 1, 0.8],
            );
            this.delay = 4000;
          };
          if (this.similarities == 2) {

            this.speechText(
              `Two similar colors, you're almost there !`, //good
              [192, 1, 0.8],
            );
            this.delay = 4000;
          };

          // this.speechText(
          //   `You have ${this.similarities} similarities between your sequences, modify your sequences again !`,
          //   [192, 1, 0.8],
          // );
        }, 1000);

        setTimeout(() => {
          this.ledChangeColor(6, 'white');
          this.ledChangeColor(7, 'white');
        }, 3900)


        setTimeout(() => {
          this.nextState = 'select-orders';
          this.goToNextState();
        }, this.delay);
        break;
        ;

      case 'party': //09 AFTER WIN
        // for (let i = 0; i < 6; i++) {
        //   this.ledChangeColor(i, this.colors[Math.random() * Math.floor(this.colors.length + 1)]) //partyyy
        // }

        this.restartOk = true;
        // for (let i = 0; i < 6; i++) {
        //   this.ledChangeColor(i, 'black') //partyyy
        // }

        // for (let i = 0; i < 6; i++) {
        //   this.ledChangeColor(i, 'white', 1) //partyyy
        // }

        // this.ledsAllChangeColor(this.colors[Math.random() * Math.floor(this.colors.length + 1)]) //partyyy
        // this.ledChangeColor(6, 'white', 2);
        this.speechText(
          'Press the main button to start a new game.',
          [192, 1, 0.8],
        );
        setTimeout(() => {
          this.nextState = 'restart';
          this.goToNextState();
        }, 3500)
        break;

        ;

      case 'restart': //10 RESTART
        // SON RESTART
        // this.ledsAllChangeColor('white') //low opacity
        this.ledChangeColor(6, 'white');
        this.ledChangeColor(7, 'white');
        for (let i = 0; i < 6; i++) {
          this.ledChangeColor(i, 'white') //partyyy
        }
        if (button == 6 && this.restartOk == true) {


          // this.ui.turnOffAllLeds();
          this.buttonColors = [-1, -1, -1, -1, -1, -1];
          // this.endOk = false;
          this.restartOk = false;
          if (this.restart.paused) {
            this.restart.volume = 1;
            this.restart.play();
            // this.endOk = true;
          }

          // if (this.restart.paused && this.endOk == true) {

          //   // this.endOk = false;
          // }

          setTimeout(() => {
            for (let i = 0; i < 6; i++) {
              this.ledChangeColor(i, 'black'); //,1 pur blink avant
            };
            this.nextState = 'select-orders';
            this.goToNextState();
          }, 2000); //AJUSTER CETTE VALEUR

        }
        break;
        ;

      case 'shut-down': //11 LONG PRESS SHUT DOWN
        //SON SHUT DOWN
        this.fancyLogger.logMessage(
          'the system has been shut down',
        );
        if (this.turnOff.paused) {
          this.turnOff.volume = 1;
          this.turnOff.play();
          // this.endOk = true;
        }
        this.buttonColors = [-1, -1, -1, -1, -1, -1];
        for (let i = 0; i < 6; i++) {
          this.ledChangeColor(i, 'black'); //,1 pur blink avant
        };
        this.restartOk = false;
        this.nextState = 'veille';
        this.goToNextState();
        break;
        ;












      case 'choose-color':
        // CONCEPT DE DIALOGUE: Branchement - le choix de l'utilisateur affecte le chemin de conversation
        // Bouton 0 = Choix bleu, Bouton 1 = Choix jaune
        if (button == 0) {
          this.nextState = 'choose-blue';
          this.goToNextState();
        }
        if (button == 1) {
          this.nextState = 'choose-yellow';
          this.goToNextState();
        }
        break;


      case 'choose-blue':
        // CONCEPT DE DIALOGUE: Retour positif - renforce le choix de l'utilisateur
        this.fancyLogger.logMessage(
          'blue was a good choice, press any button to continue',
        );
        this.ledsAllChangeColor('green', 0);
        this.nextState = 'can-speak';
        break;

      case 'choose-yellow':
        // CONCEPT DE DIALOGUE: Boucle - la conversation retourne à l'état précédent
        // Cela crée un motif de "réessayer" dans le dialogue
        this.fancyLogger.logMessage(
          'yellow was a bad choice, press blue button to continue',
        );
        this.ledsAllChangeColor('red', 0);
        this.nextState = 'choose-color';
        this.goToNextState();
        break;

      case 'can-speak':
        // CONCEPT DE DIALOGUE: Initiative système - la machine parle sans attendre d'entrée
        this.speakNormal('I can speak, i can count. Press a button.');
        this.nextState = 'count-press';
        this.ledsAllChangeColor('blue', 2);
        break;

      case 'count-press':
        // CONCEPT DE DIALOGUE: Mémoire d'état - le système se souvient des interactions précédentes
        // Le compteur persiste à travers plusieurs pressions de bouton
        this.buttonPressCounter++;

        if (this.buttonPressCounter > 3) {
          this.nextState = 'toomuch';
          this.goToNextState();
        } else {
          this.speakNormal('you pressed ' + this.buttonPressCounter + ' time');
        }
        break;

      case 'toomuch':
        // CONCEPT DE DIALOGUE: Transition conditionnelle - le comportement change selon l'état accumulé
        this.speakNormal('You are pressing too much! I Feel very pressed');
        this.nextState = 'enough-pressed';
        break;

      case 'enough-pressed':
        // CONCEPT DE DIALOGUE: État terminal - la conversation se termine ici
        //this.speak('Enough is enough! I dont want to be pressed anymore!');
        this.speechText(
          'Enough is enough! I dont want to be pressed anymore!',
          ['en-GB', 1, 1.3],
        );
        this.ledsAllChangeColor('red', 1);
        break;

      default:
        this.fancyLogger.logWarning(
          `Sorry but State: "${this.nextState} " has no case defined`,
        );
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Autres fonctions
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   *  fonction shorthand pour dire un texte avec la voix prédéfinie
   *  @param {string} _text le texte à dire
   */
  speakNormal(_text) {
    // appelé pour dire un texte
    this.speechText(_text, this.preset_voice_normal);
  }

  /**
   *  fonction shorthand pour forcer la transition vers l'état suivant dans le flux de dialogue
   *  @param {number} delay - le délai optionnel en millisecondes
   * @private
   */
  goToNextState(delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        this.dialogFlow();
      }, delay);
    } else {
      this.dialogFlow();
    }
  }

  /**
   * Effectuer des tests préliminaires avant de continuer avec le flux de dialogue
   * @returns {boolean} true si tous les tests passent, false sinon
   * @private
   */
  performPreliminaryTests() {
    if (this.dialogStarted === false) {
      this.fancyLogger.logWarning('not started yet, press Start Machine');
      return false;
    }
    if (this.waitingForUserInput === false) {
      this._handleUserInputError();
      return false;
    }
    // vérifier qu'aucune parole n'est active
    if (this.speechIsSpeaking === true) {
      this.fancyLogger.logWarning(
        'im speaking, please wait until i am finished',
      );
      return false;
    }
    if (
      this.nextState === '' ||
      this.nextState === null ||
      this.nextState === undefined
    ) {
      this.fancyLogger.logWarning('nextState is empty or undefined');
      return false;
    }

    return true;
  }

  stateUpdate() {
    this.lastState = this.nextState;
    // Mettre à jour l'affichage de l'état
    if (this.stateDisplay) {
      this.stateDisplay.textContent = this.nextState;
    }
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Overrides de TalkMachine
   * ═══════════════════════════════════════════════════════════════════════════
   */
  /**
   * override de _handleButtonPressed de TalkMachine
   * @override
   * @protected
   */
  _handleButtonPressed(button, simulated = false) {
    this.buttonStates[button] = 1;
    if (this.waitingForUserInput) {
      // this.dialogFlow('pressed', button);
    }
  }

  /**
   * override de _handleButtonReleased de TalkMachine
   * @override
   * @protected
   */
  _handleButtonReleased(button, simulated = false) {
    this.buttonStates[button] = 0;
    if (this.waitingForUserInput) {
      this.dialogFlow('released', button); //!!!
    }
  }

  /**
   * override de _handleButtonLongPressed de TalkMachine
   * @override
   * @protected
   */
  _handleButtonLongPressed(button, simulated = false) {
    if (this.waitingForUserInput) {
      this.dialogFlow('longpress', button);
    }

    if (button == 6) {
      this.nextState = 'shut-down';
      this.goToNextState();
    }

  }

  /**
   * override de _handleTextToSpeechEnded de TalkMachine
   * @override
   * @protected
   */
  _handleTextToSpeechEnded() {
    this.fancyLogger.logSpeech('speech ended');
    if (this.shouldContinue) {
      // aller à l'état suivant après la fin de la parole
      this.shouldContinue = false;
      this.goToNextState();
    }
  }

  /**
   * Gérer l'erreur d'input utilisateur
   * @protected
   */
  _handleUserInputError() {
    this.fancyLogger.logWarning('user input is not allowed at this time');
  }

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * Fonctions pour le simulateur
   * ═══════════════════════════════════════════════════════════════════════════
   */

  /**
   * Gérer les boutons test UI du simulateur
   * @param {number} button - index du bouton
   * @override
   * @protected
   */
  _handleTesterButtons(button) {
    switch (button) {
      case 1:
        this.ledsAllChangeColor('yellow');
        break;
      case 2:
        this.ledsAllChangeColor('green', 1);
        break;
      case 3:
        this.ledsAllChangeColor('pink', 2);
        break;
      case 4:
        this.ledChangeRGB(0, 255, 100, 100);
        this.ledChangeRGB(1, 0, 100, 170);
        this.ledChangeRGB(2, 0, 0, 170);
        this.ledChangeRGB(3, 150, 170, 70);
        this.ledChangeRGB(4, 200, 160, 0);
        break;

      default:
        this.fancyLogger.logWarning('no action defined for button ' + button);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const dialogMachine = new DialogMachine();
});

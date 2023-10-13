import { useCallback, useEffect, useMemo, useState } from 'react';
import Phaser from 'phaser';
import GridEngine from 'grid-engine';
import BootScene from './game/scenes/BootScene';
import MainMenuScene from './game/scenes/MainMenuScene';
import GameOverScene from './game/scenes/GameOverScene';
import GameScene from './game/scenes/GameScene';
import { makeStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import { Backdrop, Fade, Modal, Typography } from '@material-ui/core';
import dialogBorderBox from './game/assets/images/dialog_borderbox.png';
import GameMenu from "./game/GameMenu";
import DialogBox from "./game/DialogBox";
import HeroCoin from "./game/HeroCoin";
import HeroHealth from "./game/HeroHealth";
import './App.css';
import { calculateGameSize } from "./game/utils";
import { dialogs } from "./game/tasks";
import { gradingEngineBaseUrl } from "./game/constants";


const { width, height, multiplier } = calculateGameSize();

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    overflow: 'auto',
  },
  postContainer: {
    maxWidth: '90%',
    maxHeight: '90%',
  },
  gameContentWrapper: {
    width: `${width * multiplier}px`,
    height: `${height * multiplier}px`,
    margin: 'auto',
    padding: 0,
    overflow: 'hidden',
    '& canvas': {
      imageRendering: 'pixelated',
      '-ms-interpolation-mode': 'nearest-neighbor',
      boxShadow: '0px 0px 0px 3px rgba(0,0,0,0.75)',
    },
  },
  pageWrapper: {
    background: theme.palette.background.paper,
    padding: 0,
    margin: 0,
  },
  loadingText: {
    fontFamily: '"Press Start 2P"',
    marginTop: '30px',
    marginLeft: '30px',
  },
  preLoadDialogImage: {
    backgroundImage: `url("${dialogBorderBox}")`,
    backgroundSize: '1px',
    backgroundRepeat: 'no-repeat',
  },
  gameWrapper: {
    color: '#FFFFFF',
  },
  gameGif: {
    width: '100%',
    position: 'absolute',
    imageRendering: 'pixelated',
    top: 0,
  },
}));

function App() {
  const classes = useStyles();
  const [messages, setMessages] = useState([]);
  const [characterName, setCharacterName] = useState('');
  const [gameMenuItems, setGameMenuItems] = useState([]);
  const [gameMenuPosition, setGameMenuPosition] = useState('center');
  const [heroHealthStates, setHeroHealthStates] = useState([]);
  const [heroCoins, setHeroCoins] = useState(null);

  const handleMessageIsDone = useCallback(() => {
    const customEvent = new CustomEvent(`${characterName}-dialog-finished`, {
      detail: {},
    });
    window.dispatchEvent(customEvent);

    setMessages([]);
    setCharacterName('');
  }, [characterName]);

  const handleMenuItemSelected = useCallback((selectedItem) => {
    setGameMenuItems([]);

    const customEvent = new CustomEvent('menu-item-selected', {
      detail: {
        selectedItem,
      },
    });
    window.dispatchEvent(customEvent);
  }, []);

  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      title: 'some-game-title',
      parent: 'game-content',
      orientation: Phaser.Scale.LANDSCAPE,
      localStorageName: 'some-game-title',
      width,
      height,
      autoRound: true,
      pixelArt: true,
      scale: {
        autoCenter: Phaser.Scale.CENTER_BOTH,
        mode: Phaser.Scale.ENVELOP,
      },
      scene: [
        BootScene,
        MainMenuScene,
        GameScene,
        GameOverScene,
      ],
      physics: {
        default: 'arcade',
      },
      plugins: {
        scene: [{
          key: 'gridEngine',
          plugin: GridEngine,
          mapping: 'gridEngine',
        },],
      },
      backgroundColor: '#000000',
    });

    // window.phaserGame = game;
  }, []);

  let taskNumber = 0;
  let reloadCoin = false;

  const checkTasks = (heroSprite, detail, task) => {
    setTimeout(() => {
      let formData = new FormData();
      formData.append('filter', task ? task.name : "");

      const tasks = detail.tasks;
      const headers = {}

      fetch(gradingEngineBaseUrl, {
        method: 'POST',
        headers,
        body: formData
      }).then((res) => res.json()).then(
        (data) => {
          if (task) {
            for (let key in data) {
              console.log(key + "->" + data[key]);
              if (data[key] !== 1) {
                console.log("failed!");
                return;
              }
            }
            heroSprite.collectCoin(task.reward);
            taskNumber++;
          }
          else {
            heroSprite.resetCoin();
            for (let t of tasks) {              
              const passAllRequiredTestsForATask = t.tests.map(c => data[c] && data[c] === 1).every(element => element === true);
              if (passAllRequiredTestsForATask) {
                console.log("Passed: " + t.name);
                heroSprite.collectCoin(t.reward);
                taskNumber++;
              } else {
                break;
              }
            }
            reloadCoin = false;
          }
        },
        (error) => {
          console.log(error);
        }
      );
    }, task ? task.timeLimit * 1000 * 60 : 1);
  };
  useEffect(() => {
    const dialogBoxEventListener = ({ detail }) => {
      // TODO fallback
      const heroSprite = detail.heroSprite;
      if (detail.characterName === "book_01") {
        setCharacterName(detail.characterName);
        setMessages(
          dialogs[detail.characterName]
        );
        reloadCoin = true;
        checkTasks(heroSprite, detail);
        return;
      }

      if (!detail.characterName.startsWith("npc_") || reloadCoin) {
        setCharacterName(detail.characterName);
        setMessages(
          dialogs[detail.characterName]
        );
        return;
      }
      let taskMessages = [...dialogs[detail.characterName]];

      const tasks = detail.tasks;
      if (taskNumber >= tasks.length) {
        taskMessages.push({ "message": "Sorry we don't have any task for you!" });
        setCharacterName(detail.characterName);
        setMessages(
          taskMessages
        );
        return;
      }
      const task = tasks[taskNumber];
      checkTasks(heroSprite, detail, task);

      taskMessages.push({ "message": `Task ${taskNumber}: ` + task.instruction + `(You have ${task.timeLimit} minutes and you can get ${task.reward} coins!)` });

      setCharacterName(detail.characterName);
      setMessages(
        taskMessages
      );
    };
    window.addEventListener('new-dialog', dialogBoxEventListener);

    const gameMenuEventListener = ({ detail }) => {
      setGameMenuItems(detail.menuItems);
      setGameMenuPosition(detail.menuPosition);
    };
    window.addEventListener('menu-items', gameMenuEventListener);

    const heroHealthEventListener = ({ detail }) => {
      setHeroHealthStates(detail.healthStates);
    };
    window.addEventListener('hero-health', heroHealthEventListener);

    const heroCoinEventListener = ({ detail }) => {
      setHeroCoins(detail.heroCoins);
    };
    window.addEventListener('hero-coin', heroCoinEventListener);

    return () => {
      window.removeEventListener('new-dialog', dialogBoxEventListener);
      window.removeEventListener('menu-items', gameMenuEventListener);
      window.removeEventListener('hero-health', heroHealthEventListener);
      window.removeEventListener('hero-coin', heroCoinEventListener);
    };
  }, [setCharacterName, setMessages]);

  return (
    <div>
      <div className={classes.gameWrapper}>
        <div
          id="game-content"
          className={classes.gameContentWrapper}
        >
          {/* this is where the game canvas will be rendered */}
        </div>
        {heroHealthStates.length > 0 && (
          <HeroHealth
            gameSize={{
              width,
              height,
              multiplier,
            }}
            healthStates={heroHealthStates}
          />
        )}
        {heroCoins !== null && (
          <HeroCoin
            gameSize={{
              width,
              height,
              multiplier,
            }}
            heroCoins={heroCoins}
          />
        )}
        {messages.length > 0 && (
          <DialogBox
            onDone={handleMessageIsDone}
            characterName={characterName}
            messages={messages}
            gameSize={{
              width,
              height,
              multiplier,
            }}
          />
        )}
        {gameMenuItems.length > 0 && (
          <GameMenu
            items={gameMenuItems}
            gameSize={{
              width,
              height,
              multiplier,
            }}
            position={gameMenuPosition}
            onSelected={handleMenuItemSelected}
          />
        )}
      </div>
    </div>
  );
}

export default App;
